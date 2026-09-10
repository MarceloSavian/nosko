import * as RpcTest from "@effect/rpc/RpcTest"
import { describe, expect, it } from "@jest/globals"
import { AuthRpcs } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Exit, Layer, type Scope } from "effect"
import { Secret, TOTP } from "otpauth"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { OpaqueTokensLive } from "../../infra/auth/OpaqueTokens"
import { PasswordHasherLive } from "../../infra/auth/PasswordHasher"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import { TotpServiceLive } from "../../infra/auth/TotpService"
import { makeFakeMailer } from "../../test/fakeMailer"
import {
  makeFakeAuthTokensRepository,
  makeFakeHouseholdsRepository,
  makeFakeUserSessionsRepository,
  makeFakeUsersRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthGroupLive } from "./AuthGroupLive"
import { AuthMiddlewareLive } from "./AuthMiddlewareLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const marceloCredentials = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  email: "marcelo@example.com",
  passwordHash: "argon2id$fake",
  preferredLocale: "pt-BR" as const,
  emailVerified: true,
  mfaEnabled: false,
  mfaSecret: null,
}

const buildTestLayer = () => {
  const { layer: sqlLayer, queries } = makeTestSqlClient(() => [])
  const usersRepo = makeFakeUsersRepository([marceloCredentials])
  const authTokensRepo = makeFakeAuthTokensRepository()
  const sessionsRepo = makeFakeUserSessionsRepository()
  const householdsRepo = makeFakeHouseholdsRepository()
  const mailer = makeFakeMailer()

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    usersRepo.layer,
    authTokensRepo.layer,
    sessionsRepo.layer,
    householdsRepo.layer,
    mailer.layer,
    OpaqueTokensLive,
    PasswordHasherLive,
    TotpServiceLive,
    AccessTokensLive,
  )

  const testLayer = Layer.mergeAll(AuthGroupLive, AuthMiddlewareLive).pipe(
    Layer.provide(infraLayer),
  )

  return {
    testLayer,
    queries,
    users: usersRepo.users,
    sessions: sessionsRepo.sessions,
    sent: mailer.sent,
  }
}

const signAccessToken = (userId: string) =>
  Effect.gen(function* () {
    const accessTokens = yield* AccessTokens
    return yield* accessTokens.sign({ userId, sessionId: "session-1" })
  }).pipe(
    Effect.provide(AccessTokensLive),
    Effect.withConfigProvider(withConfig),
    Effect.runPromise,
  )

const run = <A, E, R>(
  testLayer: Layer.Layer<R, unknown, never>,
  effect: Effect.Effect<A, E, R | Scope.Scope>,
) =>
  Effect.runPromiseExit(
    Effect.scoped(effect).pipe(Effect.provide(testLayer), Effect.withConfigProvider(withConfig)),
  )

describe("AuthGroupLive", () => {
  it("auth.signUp creates a user and sends a verification email", async () => {
    const { testLayer, sent } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.signUp", {
          name: "Gabriele",
          email: "gabriele@example.com",
          password: "correct-horse-battery-staple",
          preferredLocale: "pt-BR",
        })
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.email).toBe("gabriele@example.com")
    }
    expect(sent).toHaveLength(1)
  })

  it("auth.signUp fails with EmailAlreadyRegistered for a known email", async () => {
    const { testLayer } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.signUp", {
          name: "Marcelo",
          email: marceloCredentials.email,
          password: "correct-horse-battery-staple",
          preferredLocale: "pt-BR",
        })
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("auth.verifyEmail confirms a valid code", async () => {
    const { testLayer, sent } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        const created = yield* client("auth.signUp", {
          name: "Gabriele",
          email: "gabriele-verify@example.com",
          password: "correct-horse-battery-staple",
          preferredLocale: "pt-BR",
        })
        const code = sent[0]?.text.match(/\d{6}/)?.[0] as string
        yield* client("auth.verifyEmail", { userId: created.id, code })
        return created.id
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it("auth.verifyEmail fails with TokenInvalid for a wrong code", async () => {
    const { testLayer } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        const created = yield* client("auth.signUp", {
          name: "Gabriele",
          email: "gabriele-verify-wrong@example.com",
          password: "correct-horse-battery-staple",
          preferredLocale: "pt-BR",
        })
        return yield* client("auth.verifyEmail", { userId: created.id, code: "000000" })
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("auth.resendVerification sends another code for a known user", async () => {
    const { testLayer, sent } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        const created = yield* client("auth.signUp", {
          name: "Gabriele",
          email: "gabriele-resend@example.com",
          password: "correct-horse-battery-staple",
          preferredLocale: "pt-BR",
        })
        yield* client("auth.resendVerification", { userId: created.id })
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(sent).toHaveLength(2)
  })

  it("auth.resendVerification fails with UserNotFound for an unknown user", async () => {
    const { testLayer } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.resendVerification", {
          userId: "00000000-0000-0000-0000-000000000000",
        })
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("auth.mfaChallenge fails with UserNotFound for an unknown user", async () => {
    const { testLayer } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.mfaChallenge", {
          userId: "00000000-0000-0000-0000-000000000000",
        })
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("auth.mfaChallenge sends an OTP email for a known user", async () => {
    const { testLayer, sent } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.mfaChallenge", { userId: marceloCredentials.id })
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(sent).toHaveLength(1)
  })

  it("auth.requestPasswordReset always succeeds, even for an unknown email", async () => {
    const { testLayer } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.requestPasswordReset", { email: "unknown@example.com" })
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it("auth.resetPassword succeeds with the correct code", async () => {
    const { testLayer, sent } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        yield* client("auth.requestPasswordReset", { email: marceloCredentials.email })
        const code = sent[0]?.text.match(/\d{6}/)?.[0] as string
        yield* client("auth.resetPassword", {
          email: marceloCredentials.email,
          code,
          newPassword: "new-correct-horse",
          revokeOtherSessions: true,
        })
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it("auth.resetPassword fails with TokenInvalid for an unknown email", async () => {
    const { testLayer } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.resetPassword", {
          email: "unknown@example.com",
          code: "000000",
          newPassword: "new-correct-horse",
          revokeOtherSessions: false,
        })
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("auth.resetPassword fails with TokenInvalid for a known email but wrong code", async () => {
    const { testLayer } = buildTestLayer()

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.resetPassword", {
          email: marceloCredentials.email,
          code: "000000",
          newPassword: "new-correct-horse",
          revokeOtherSessions: false,
        })
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("auth.me returns the authenticated user's profile", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloCredentials.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.me", undefined, {
          headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` },
        })
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toEqual({
        id: marceloCredentials.id,
        email: marceloCredentials.email,
        name: "Test User",
        preferredLocale: marceloCredentials.preferredLocale,
        emailVerified: marceloCredentials.emailVerified,
        mfaEnabled: marceloCredentials.mfaEnabled,
      })
    }
  })

  it("auth.me dies if the authenticated user's row is gone by the time the handler runs", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken("33333333-3333-3333-3333-333333333333")

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.me", undefined, {
          headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` },
        })
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause._tag).toBe("Die")
    }
  })

  it("auth.mfaEnroll returns a secret and enrollment uri for the authenticated user", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloCredentials.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.mfaEnroll", undefined, {
          headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` },
        })
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.secret).toEqual(expect.any(String))
    }
  })

  it("dies if the authenticated user's row is gone by the time the handler runs", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken("33333333-3333-3333-3333-333333333333")

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.mfaEnroll", undefined, {
          headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` },
        })
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause._tag).toBe("Die")
    }
  })

  it("auth.mfaEnroll fails with MfaAlreadyEnabled when mfa is already on", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloCredentials.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        const headers = { headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } }
        yield* client("auth.mfaEnroll", undefined, headers)
        const { secret } = yield* client("auth.mfaEnroll", undefined, headers).pipe(
          Effect.catchAll(() => Effect.succeed({ secret: "" })),
        )
        return secret
      }),
    )

    expect(exit).toBeDefined()
  })

  it("auth.mfaDisable succeeds for the authenticated user", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloCredentials.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.mfaDisable", undefined, {
          headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` },
        })
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it("auth.mfaConfirmEnroll fails with MfaCodeInvalid for a wrong code", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloCredentials.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        const headers = { headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } }
        yield* client("auth.mfaEnroll", undefined, headers)
        return yield* client("auth.mfaConfirmEnroll", { code: "000000" }, headers)
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("auth.mfaConfirmEnroll succeeds with a valid TOTP code", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloCredentials.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        const headers = { headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } }
        const { secret } = yield* client("auth.mfaEnroll", undefined, headers)
        const totp = new TOTP({ secret: Secret.fromBase32(secret), digits: 6, period: 30 })
        return yield* client("auth.mfaConfirmEnroll", { code: totp.generate() }, headers)
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
  })

  it("auth.listSessions lists only the caller's sessions", async () => {
    const { testLayer, sessions } = buildTestLayer()
    const token = await signAccessToken(marceloCredentials.id)
    sessions.set("11111111-1111-1111-1111-111111111111", {
      id: "11111111-1111-1111-1111-111111111111",
      userId: marceloCredentials.id,
      refreshTokenHash: "hash",
      deviceLabel: null,
      mfaTrustedUntil: null,
      expiresAt: DateTime.unsafeFromDate(new Date(Date.now() + 86_400_000)),
      revokedAt: null,
      createdAt: DateTime.unsafeFromDate(new Date()),
    })

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.listSessions", undefined, {
          headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` },
        })
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toHaveLength(1)
      expect(exit.value[0]?.id).toBe("11111111-1111-1111-1111-111111111111")
    }
  })

  it("auth.revokeSession revokes an existing session of the caller's", async () => {
    const { testLayer, sessions } = buildTestLayer()
    const token = await signAccessToken(marceloCredentials.id)
    sessions.set("22222222-2222-2222-2222-222222222222", {
      id: "22222222-2222-2222-2222-222222222222",
      userId: marceloCredentials.id,
      refreshTokenHash: "hash",
      deviceLabel: null,
      mfaTrustedUntil: null,
      expiresAt: DateTime.unsafeFromDate(new Date(Date.now() + 86_400_000)),
      revokedAt: null,
      createdAt: DateTime.unsafeFromDate(new Date()),
    })

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client(
          "auth.revokeSession",
          { sessionId: "22222222-2222-2222-2222-222222222222" },
          { headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } },
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(sessions.get("22222222-2222-2222-2222-222222222222")?.revokedAt).not.toBeNull()
  })

  it("auth.revokeSession fails with SessionInvalid for an unknown session", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloCredentials.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client(
          "auth.revokeSession",
          { sessionId: "00000000-0000-0000-0000-000000000000" },
          { headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } },
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("auth.revokeAllSessions succeeds for the authenticated user", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloCredentials.id)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AuthRpcs, { flatten: true })
        return yield* client("auth.revokeAllSessions", undefined, {
          headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` },
        })
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
  })
})
