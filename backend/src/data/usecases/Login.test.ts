import { describe, expect, it } from "@jest/globals"
import { ConfigProvider, Effect, Layer } from "effect"
import { Secret, TOTP } from "otpauth"
import { AccessTokensLive } from "../../infra/auth/AccessTokens"
import { OpaqueTokens, OpaqueTokensLive } from "../../infra/auth/OpaqueTokens"
import { PasswordHasher, PasswordHasherLive } from "../../infra/auth/PasswordHasher"
import { TotpServiceLive } from "../../infra/auth/TotpService"
import {
  makeFakeAuthTokensRepository,
  makeFakeUserSessionsRepository,
  makeFakeUsersRepository,
} from "../../test/fakeRepositories"
import { AuthTokensRepository } from "../protocols/AuthTokensRepository"
import { login, mfaVerify } from "./Login"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const commonLayers = Layer.mergeAll(
  PasswordHasherLive,
  OpaqueTokensLive,
  AccessTokensLive,
  TotpServiceLive,
)

const PASSWORD = "correct horse battery staple"

const hashPassword = (password: string) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const hasher = yield* PasswordHasher
      return yield* hasher.hash(password)
    }).pipe(Effect.provide(PasswordHasherLive)),
  )

const seedUser = async (
  overrides: {
    readonly mfaEnabled?: boolean
    readonly mfaSecret?: string | null
    readonly emailVerified?: boolean
  } = {},
) => ({
  id: "user-1",
  email: "marcelo@example.com",
  passwordHash: await hashPassword(PASSWORD),
  emailVerified: overrides.emailVerified ?? true,
  mfaEnabled: overrides.mfaEnabled ?? false,
  mfaSecret: overrides.mfaSecret ?? null,
})

const runLogin = (
  usersLayer: ReturnType<typeof makeFakeUsersRepository>["layer"],
  sessionsLayer: ReturnType<typeof makeFakeUserSessionsRepository>["layer"],
  input: Parameters<typeof login>[0],
) =>
  Effect.runPromise(
    login(input).pipe(
      Effect.provide(usersLayer),
      Effect.provide(sessionsLayer),
      Effect.provide(commonLayers),
      Effect.withConfigProvider(withConfig),
    ),
  )

describe("login", () => {
  it("authenticates directly when MFA is not enabled", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([await seedUser()])
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()

    const result = await runLogin(usersLayer, sessionsLayer, {
      email: "marcelo@example.com",
      password: PASSWORD,
    })

    expect(result.status).toBe("authenticated")
    if (result.status === "authenticated") {
      expect(result.userId).toBe("user-1")
      expect(result.accessToken).toEqual(expect.any(String))
    }
  })

  it("fails with InvalidCredentials for an unknown email", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository()
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()

    const exit = await Effect.runPromiseExit(
      login({ email: "nobody@example.com", password: PASSWORD }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(commonLayers),
        Effect.withConfigProvider(withConfig),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("fails with InvalidCredentials for a wrong password", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([await seedUser()])
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()

    const exit = await Effect.runPromiseExit(
      login({ email: "marcelo@example.com", password: "wrong" }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(commonLayers),
        Effect.withConfigProvider(withConfig),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("fails with EmailNotVerified before the email is confirmed", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([
      await seedUser({ emailVerified: false }),
    ])
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()

    const exit = await Effect.runPromiseExit(
      login({ email: "marcelo@example.com", password: PASSWORD }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(commonLayers),
        Effect.withConfigProvider(withConfig),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("requires MFA when enabled and no device token is presented", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([
      await seedUser({ mfaEnabled: true, mfaSecret: "SOMESECRET" }),
    ])
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()

    const result = await runLogin(usersLayer, sessionsLayer, {
      email: "marcelo@example.com",
      password: PASSWORD,
    })

    expect(result).toEqual({ status: "mfa_required", userId: "user-1" })
  })

  it("skips MFA when a trusted device token is presented", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([
      await seedUser({ mfaEnabled: true, mfaSecret: "SOMESECRET" }),
    ])
    const { layer: sessionsLayer, sessions } = makeFakeUserSessionsRepository()

    const first = await runLogin(usersLayer, sessionsLayer, {
      email: "marcelo@example.com",
      password: PASSWORD,
    })
    expect(first.status).toBe("mfa_required")

    const totp = new TOTP({ secret: Secret.fromBase32("SOMESECRET") })
    const verified = await Effect.runPromise(
      mfaVerify({ userId: "user-1", code: totp.generate(), rememberDevice: true }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(makeFakeAuthTokensRepository().layer),
        Effect.provide(sessionsLayer),
        Effect.provide(commonLayers),
        Effect.withConfigProvider(withConfig),
      ),
    )
    expect(verified.status).toBe("authenticated")

    const second = await runLogin(usersLayer, sessionsLayer, {
      email: "marcelo@example.com",
      password: PASSWORD,
      deviceToken: verified.status === "authenticated" ? verified.refreshToken : "",
    })
    expect(second.status).toBe("authenticated")
    expect(sessions.size).toBeGreaterThanOrEqual(2)
  })
})

describe("mfaVerify", () => {
  it("authenticates with a correct TOTP code", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([
      await seedUser({ mfaEnabled: true, mfaSecret: "SOMESECRET" }),
    ])
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()
    const { layer: authTokensLayer } = makeFakeAuthTokensRepository()

    const totp = new TOTP({ secret: Secret.fromBase32("SOMESECRET") })

    const result = await Effect.runPromise(
      mfaVerify({ userId: "user-1", code: totp.generate(), rememberDevice: false }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(commonLayers),
        Effect.withConfigProvider(withConfig),
      ),
    )

    expect(result.status).toBe("authenticated")
  })

  it("authenticates with a valid emailed OTP code", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([
      await seedUser({ mfaEnabled: true, mfaSecret: "SOMESECRET" }),
    ])
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()
    const { layer: authTokensLayer } = makeFakeAuthTokensRepository()

    await Effect.runPromise(
      Effect.gen(function* () {
        const opaqueTokens = yield* OpaqueTokens
        const authTokens = yield* AuthTokensRepository
        yield* authTokens.create({
          userId: "user-1",
          type: "mfa_otp",
          tokenHash: opaqueTokens.hash("111222"),
          expiresAt: new Date(Date.now() + 60_000),
        })
      }).pipe(Effect.provide(authTokensLayer), Effect.provide(OpaqueTokensLive)),
    )

    const result = await Effect.runPromise(
      mfaVerify({ userId: "user-1", code: "111222", rememberDevice: false }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(commonLayers),
        Effect.withConfigProvider(withConfig),
      ),
    )

    expect(result.status).toBe("authenticated")
  })

  it("fails with MfaCodeInvalid for a wrong code", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([
      await seedUser({ mfaEnabled: true, mfaSecret: "SOMESECRET" }),
    ])
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()
    const { layer: authTokensLayer } = makeFakeAuthTokensRepository()

    const exit = await Effect.runPromiseExit(
      mfaVerify({ userId: "user-1", code: "000000", rememberDevice: false }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(commonLayers),
        Effect.withConfigProvider(withConfig),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("fails with MfaCodeInvalid when MFA is not enabled for the user", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([await seedUser()])
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()
    const { layer: authTokensLayer } = makeFakeAuthTokensRepository()

    const exit = await Effect.runPromiseExit(
      mfaVerify({ userId: "user-1", code: "000000", rememberDevice: false }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(commonLayers),
        Effect.withConfigProvider(withConfig),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })
})
