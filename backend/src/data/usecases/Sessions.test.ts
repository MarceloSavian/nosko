import { describe, expect, it } from "@jest/globals"
import { ConfigProvider, Effect, type Layer } from "effect"
import { type AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { type OpaqueTokens, OpaqueTokensLive } from "../../infra/auth/OpaqueTokens"
import { makeFakeUserSessionsRepository } from "../../test/fakeRepositories"
import type { UserSessionsRepository } from "../protocols/UserSessionsRepository"
import {
  issueSession,
  listSessions,
  logout,
  refreshSession,
  revokeAllSessions,
  revokeSession,
} from "./Sessions"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const runWith = <A, E>(
  sessionsLayer: Layer.Layer<UserSessionsRepository>,
  effect: Effect.Effect<A, E, UserSessionsRepository | OpaqueTokens | AccessTokens>,
) =>
  Effect.runPromise(
    effect.pipe(
      Effect.provide(sessionsLayer),
      Effect.provide(OpaqueTokensLive),
      Effect.provide(AccessTokensLive),
      Effect.withConfigProvider(withConfig),
    ),
  )

describe("issueSession", () => {
  it("creates a session and a matching access token", async () => {
    const { layer } = makeFakeUserSessionsRepository()

    const issued = await runWith(
      layer,
      issueSession({ userId: "user-1", deviceLabel: null, mfaTrustedUntil: null }),
    )

    expect(issued.userId).toBe("user-1")
    expect(issued.accessToken).toEqual(expect.any(String))
    expect(issued.refreshToken).toEqual(expect.any(String))
  })
})

describe("refreshSession", () => {
  it("issues a new access token for a valid refresh token", async () => {
    const { layer } = makeFakeUserSessionsRepository()

    const result = await runWith(
      layer,
      Effect.gen(function* () {
        const issued = yield* issueSession({
          userId: "user-1",
          deviceLabel: null,
          mfaTrustedUntil: null,
        })
        return yield* refreshSession("user-1", issued.refreshToken)
      }),
    )

    expect(result.userId).toBe("user-1")
  })

  it("fails with SessionInvalid for an unknown refresh token", async () => {
    const { layer } = makeFakeUserSessionsRepository()

    const exit = await Effect.runPromiseExit(
      refreshSession("user-1", "not-a-real-token").pipe(
        Effect.provide(layer),
        Effect.provide(OpaqueTokensLive),
        Effect.provide(AccessTokensLive),
        Effect.withConfigProvider(withConfig),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })
})

describe("logout / revokeSession", () => {
  it("revokes the caller's own session", async () => {
    const { layer, sessions } = makeFakeUserSessionsRepository()

    const issued = await runWith(
      layer,
      issueSession({ userId: "user-1", deviceLabel: null, mfaTrustedUntil: null }),
    )
    const sessionId = [...sessions.values()][0]?.id as string

    await runWith(layer, logout("user-1", sessionId))

    expect(sessions.get(sessionId)?.revokedAt).not.toBeNull()
    expect(issued).toBeDefined()
  })

  it("refuses to revoke a session belonging to another user", async () => {
    const { layer, sessions } = makeFakeUserSessionsRepository()

    await runWith(
      layer,
      issueSession({ userId: "user-1", deviceLabel: null, mfaTrustedUntil: null }),
    )
    const sessionId = [...sessions.values()][0]?.id as string

    const exit = await Effect.runPromiseExit(
      revokeSession("someone-else", sessionId).pipe(Effect.provide(layer)),
    )

    expect(exit._tag).toBe("Failure")
    expect(sessions.get(sessionId)?.revokedAt).toBeNull()
  })

  it("fails with SessionInvalid for an unknown session id", async () => {
    const { layer } = makeFakeUserSessionsRepository()

    const exit = await Effect.runPromiseExit(
      revokeSession("user-1", "missing").pipe(Effect.provide(layer)),
    )

    expect(exit._tag).toBe("Failure")
  })
})

describe("listSessions", () => {
  it("lists only the caller's sessions", async () => {
    const { layer } = makeFakeUserSessionsRepository()

    await runWith(
      layer,
      issueSession({ userId: "user-1", deviceLabel: null, mfaTrustedUntil: null }),
    )
    await runWith(
      layer,
      issueSession({ userId: "user-2", deviceLabel: null, mfaTrustedUntil: null }),
    )

    const result = await Effect.runPromise(listSessions("user-1").pipe(Effect.provide(layer)))

    expect(result).toHaveLength(1)
    expect(result[0]?.userId).toBe("user-1")
  })
})

describe("revokeAllSessions", () => {
  it("revokes every active session for the user", async () => {
    const { layer, sessions } = makeFakeUserSessionsRepository()

    await runWith(
      layer,
      issueSession({ userId: "user-1", deviceLabel: null, mfaTrustedUntil: null }),
    )
    await runWith(
      layer,
      issueSession({ userId: "user-1", deviceLabel: null, mfaTrustedUntil: null }),
    )

    await Effect.runPromise(revokeAllSessions("user-1").pipe(Effect.provide(layer)))

    expect([...sessions.values()].every((s) => s.revokedAt !== null)).toBe(true)
  })
})
