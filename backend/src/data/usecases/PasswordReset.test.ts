import { describe, expect, it } from "@jest/globals"
import { DateTime, Effect, Layer } from "effect"
import { OpaqueTokensLive } from "../../infra/auth/OpaqueTokens"
import { PasswordHasherLive } from "../../infra/auth/PasswordHasher"
import { makeFakeMailer } from "../../test/fakeMailer"
import {
  makeFakeAuthTokensRepository,
  makeFakeUserSessionsRepository,
  makeFakeUsersRepository,
} from "../../test/fakeRepositories"
import { requestPasswordReset, resetPassword } from "./PasswordReset"

const baseLayers = Layer.mergeAll(PasswordHasherLive, OpaqueTokensLive)

const seedUser = () => ({
  id: "user-1",
  email: "marcelo@example.com",
  passwordHash: "old-hash",
  preferredLocale: "pt-BR" as const,
  emailVerified: true,
  mfaEnabled: false,
  mfaSecret: null,
})

describe("requestPasswordReset", () => {
  it("creates a reset token and emails a code for a known email", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository([seedUser()])
    const { layer: authTokensLayer, tokens } = makeFakeAuthTokensRepository()
    const { layer: mailerLayer, sent } = makeFakeMailer()

    await Effect.runPromise(
      requestPasswordReset("marcelo@example.com").pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(mailerLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(tokens.size).toBe(1)
    expect(sent).toHaveLength(1)
    expect(sent[0]?.to).toBe("marcelo@example.com")
  })

  it("does nothing for an unknown email, without leaking whether it exists", async () => {
    const { layer: usersLayer } = makeFakeUsersRepository()
    const { layer: authTokensLayer, tokens } = makeFakeAuthTokensRepository()
    const { layer: mailerLayer, sent } = makeFakeMailer()

    await Effect.runPromise(
      requestPasswordReset("nobody@example.com").pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(mailerLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(tokens.size).toBe(0)
    expect(sent).toHaveLength(0)
  })
})

const requestAndCaptureCode = async () => {
  const { layer: usersLayer, users } = makeFakeUsersRepository([seedUser()])
  const { layer: authTokensLayer } = makeFakeAuthTokensRepository()
  const { layer: mailerLayer, sent } = makeFakeMailer()

  await Effect.runPromise(
    requestPasswordReset("marcelo@example.com").pipe(
      Effect.provide(usersLayer),
      Effect.provide(authTokensLayer),
      Effect.provide(mailerLayer),
      Effect.provide(baseLayers),
    ),
  )

  const code = sent[0]?.text.match(/\d{6}/)?.[0] as string

  return { usersLayer, users, authTokensLayer, code }
}

describe("resetPassword", () => {
  it("updates the password for a valid code", async () => {
    const { usersLayer, users, authTokensLayer, code } = await requestAndCaptureCode()
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()

    await Effect.runPromise(
      resetPassword({
        userId: "user-1",
        code,
        newPassword: "a brand new password",
        revokeOtherSessions: false,
      }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(users.get("user-1")?.passwordHash).not.toBe("old-hash")
  })

  it("fails with TokenInvalid for a wrong code", async () => {
    const { usersLayer, authTokensLayer } = await requestAndCaptureCode()
    const { layer: sessionsLayer } = makeFakeUserSessionsRepository()

    const exit = await Effect.runPromiseExit(
      resetPassword({
        userId: "user-1",
        code: "000000",
        newPassword: "a brand new password",
        revokeOtherSessions: false,
      }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("revokes other sessions when asked to", async () => {
    const { usersLayer, authTokensLayer, code } = await requestAndCaptureCode()
    const { layer: sessionsLayer, sessions } = makeFakeUserSessionsRepository()

    sessions.set("session-1", {
      id: "session-1",
      userId: "user-1",
      refreshTokenHash: "hash",
      deviceLabel: null,
      mfaTrustedUntil: null,
      expiresAt: DateTime.unsafeFromDate(new Date(Date.now() + 60_000)),
      revokedAt: null,
      createdAt: DateTime.unsafeFromDate(new Date()),
    })

    await Effect.runPromise(
      resetPassword({
        userId: "user-1",
        code,
        newPassword: "a brand new password",
        revokeOtherSessions: true,
      }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(sessions.get("session-1")?.revokedAt).not.toBeNull()
  })

  it("leaves other sessions alone when not asked to revoke them", async () => {
    const { usersLayer, authTokensLayer, code } = await requestAndCaptureCode()
    const { layer: sessionsLayer, sessions } = makeFakeUserSessionsRepository()

    sessions.set("session-1", {
      id: "session-1",
      userId: "user-1",
      refreshTokenHash: "hash",
      deviceLabel: null,
      mfaTrustedUntil: null,
      expiresAt: DateTime.unsafeFromDate(new Date(Date.now() + 60_000)),
      revokedAt: null,
      createdAt: DateTime.unsafeFromDate(new Date()),
    })

    await Effect.runPromise(
      resetPassword({
        userId: "user-1",
        code,
        newPassword: "a brand new password",
        revokeOtherSessions: false,
      }).pipe(
        Effect.provide(usersLayer),
        Effect.provide(authTokensLayer),
        Effect.provide(sessionsLayer),
        Effect.provide(baseLayers),
      ),
    )

    expect(sessions.get("session-1")?.revokedAt).toBeNull()
  })
})
