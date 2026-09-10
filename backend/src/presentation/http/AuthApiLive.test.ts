import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import * as HttpServer from "@effect/platform/HttpServer"
import { describe, expect, it } from "@jest/globals"
import { AuthApi } from "@nosko/contracts"
import { ConfigProvider, Effect, Layer } from "effect"
import { Secret, TOTP } from "otpauth"
import { AccessTokensLive } from "../../infra/auth/AccessTokens"
import { OpaqueTokensLive } from "../../infra/auth/OpaqueTokens"
import { PasswordHasher, PasswordHasherLive } from "../../infra/auth/PasswordHasher"
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import { TotpServiceLive } from "../../infra/auth/TotpService"
import { makeFakeMailer } from "../../test/fakeMailer"
import {
  makeFakeAuthTokensRepository,
  makeFakeUserSessionsRepository,
  makeFakeUsersRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthApiLive } from "./AuthApiLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

type WebHandler = ReturnType<typeof HttpApiBuilder.toWebHandler>["handler"]

const buildHandler = async (mfaEnabled: boolean) => {
  const { layer: sqlLayer } = makeTestSqlClient(() => [])
  const usersRepo = makeFakeUsersRepository()
  const authTokensRepo = makeFakeAuthTokensRepository()
  const sessionsRepo = makeFakeUserSessionsRepository()
  const mailer = makeFakeMailer()

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    usersRepo.layer,
    authTokensRepo.layer,
    sessionsRepo.layer,
    mailer.layer,
    OpaqueTokensLive,
    PasswordHasherLive,
    TotpServiceLive,
    AccessTokensLive,
  ).pipe(Layer.provide(Layer.setConfigProvider(withConfig)))

  const apiLayer = Layer.mergeAll(
    HttpApiBuilder.api(AuthApi).pipe(Layer.provide(AuthApiLive)),
    HttpServer.layerContext,
  ).pipe(Layer.provide(infraLayer))

  const passwordHash = await Effect.runPromise(
    Effect.gen(function* () {
      const hasher = yield* PasswordHasher
      return yield* hasher.hash("correct-horse-battery-staple")
    }).pipe(Effect.provide(PasswordHasherLive)),
  )

  const userId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
  const mfaSecret = mfaEnabled ? new Secret().base32 : null
  usersRepo.users.set(userId, {
    id: userId,
    email: "marcelo@example.com",
    passwordHash,
    preferredLocale: "pt-BR",
    emailVerified: true,
    mfaEnabled,
    mfaSecret,
  })

  const { handler, dispose } = HttpApiBuilder.toWebHandler(apiLayer)
  return { handler, dispose, userId, mfaSecret, sessions: sessionsRepo.sessions }
}

const post = (handler: WebHandler, path: string, body: unknown, cookie?: string) =>
  handler(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    }),
  )

interface LoginResponseBody {
  readonly status: "authenticated" | "mfa_required"
  readonly userId: string
}

describe("AuthApiLive", () => {
  it("login sets both session cookies for a user without MFA", async () => {
    const { handler, dispose, userId } = await buildHandler(false)

    const response = await post(handler, "/api/http/auth/login", {
      email: "marcelo@example.com",
      password: "correct-horse-battery-staple",
    })

    expect(response.status).toBe(200)
    const body = (await response.json()) as LoginResponseBody
    expect(body).toEqual({ status: "authenticated", userId })
    const cookies = response.headers.getSetCookie()
    expect(cookies.some((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))).toBe(true)
    expect(cookies.some((c) => c.startsWith(`${REFRESH_TOKEN_COOKIE}=`))).toBe(true)
    await dispose()
  })

  it("login accepts an (unrecognised) deviceToken alongside the credentials", async () => {
    const { handler, dispose } = await buildHandler(false)

    const response = await post(handler, "/api/http/auth/login", {
      email: "marcelo@example.com",
      password: "correct-horse-battery-staple",
      deviceToken: "not-a-remembered-device",
    })

    expect(response.status).toBe(200)
    await dispose()
  })

  it("login returns mfa_required with no cookies when MFA is enabled", async () => {
    const { handler, dispose } = await buildHandler(true)

    const response = await post(handler, "/api/http/auth/login", {
      email: "marcelo@example.com",
      password: "correct-horse-battery-staple",
    })

    expect(response.status).toBe(200)
    const body = (await response.json()) as LoginResponseBody
    expect(body.status).toBe("mfa_required")
    expect(response.headers.getSetCookie()).toHaveLength(0)
    await dispose()
  })

  it("login fails with InvalidCredentials for a wrong password", async () => {
    const { handler, dispose } = await buildHandler(false)

    const response = await post(handler, "/api/http/auth/login", {
      email: "marcelo@example.com",
      password: "wrong-password",
    })

    expect(response.status).toBeGreaterThanOrEqual(400)
    await dispose()
  })

  it("logout clears both cookies even without a session cookie", async () => {
    const { handler, dispose } = await buildHandler(false)

    const response = await post(handler, "/api/http/auth/logout", {})

    expect(response.status).toBe(200)
    const cookies = response.headers.getSetCookie()
    expect(cookies.some((c) => c.includes("Max-Age=0"))).toBe(true)
    await dispose()
  })

  it("refresh fails with SessionInvalid when there is no session cookie", async () => {
    const { handler, dispose } = await buildHandler(false)

    const response = await post(handler, "/api/http/auth/refresh", {})

    expect(response.status).toBeGreaterThanOrEqual(400)
    await dispose()
  })

  it("login then refresh issues a fresh access token", async () => {
    const { handler, dispose } = await buildHandler(false)

    const loginResponse = await post(handler, "/api/http/auth/login", {
      email: "marcelo@example.com",
      password: "correct-horse-battery-staple",
    })
    const cookieHeader = loginResponse.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ")

    const refreshResponse = await post(handler, "/api/http/auth/refresh", {}, cookieHeader)

    expect(refreshResponse.status).toBe(200)
    const cookies = refreshResponse.headers.getSetCookie()
    expect(cookies.some((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))).toBe(true)
    await dispose()
  })

  it("login then logout revokes the session", async () => {
    const { handler, dispose, sessions } = await buildHandler(false)

    const loginResponse = await post(handler, "/api/http/auth/login", {
      email: "marcelo@example.com",
      password: "correct-horse-battery-staple",
    })
    const cookieHeader = loginResponse.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ")

    const logoutResponse = await post(handler, "/api/http/auth/logout", {}, cookieHeader)

    expect(logoutResponse.status).toBe(200)
    expect([...sessions.values()].every((s) => s.revokedAt !== null)).toBe(true)
    await dispose()
  })

  it("mfaVerify fails with MfaCodeInvalid for a wrong code", async () => {
    const { handler, dispose, userId } = await buildHandler(true)

    const response = await post(handler, "/api/http/auth/mfa-verify", {
      userId,
      code: "000000",
      rememberDevice: false,
    })

    expect(response.status).toBeGreaterThanOrEqual(400)
    await dispose()
  })

  it("mfaVerify sets both session cookies for a valid TOTP code", async () => {
    const { handler, dispose, userId, mfaSecret } = await buildHandler(true)
    const totp = new TOTP({ secret: Secret.fromBase32(mfaSecret as string), digits: 6, period: 30 })

    const response = await post(handler, "/api/http/auth/mfa-verify", {
      userId,
      code: totp.generate(),
      rememberDevice: false,
    })

    expect(response.status).toBe(200)
    const cookies = response.headers.getSetCookie()
    expect(cookies.some((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))).toBe(true)
    expect(cookies.some((c) => c.startsWith(`${REFRESH_TOKEN_COOKIE}=`))).toBe(true)
    await dispose()
  })
})
