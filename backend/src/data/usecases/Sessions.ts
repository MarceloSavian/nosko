import { Effect, Option } from "effect"
import { SessionInvalid } from "../../domain/errors/AuthErrors"
import { AccessTokens } from "../../infra/auth/AccessTokens"
import { OpaqueTokens } from "../../infra/auth/OpaqueTokens"
import { UserSessionsRepository } from "../protocols/UserSessionsRepository"

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface IssuedSession {
  readonly userId: string
  readonly accessToken: string
  readonly refreshToken: string
}

export const issueSession = (input: {
  readonly userId: string
  readonly deviceLabel: string | null
  readonly mfaTrustedUntil: Date | null
}) =>
  Effect.gen(function* () {
    const sessions = yield* UserSessionsRepository
    const opaqueTokens = yield* OpaqueTokens
    const accessTokens = yield* AccessTokens

    const { token: refreshToken, hash } = opaqueTokens.generate()
    const session = yield* sessions.create({
      userId: input.userId,
      refreshTokenHash: hash,
      deviceLabel: input.deviceLabel,
      mfaTrustedUntil: input.mfaTrustedUntil,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    })
    const accessToken = yield* accessTokens.sign({ userId: input.userId, sessionId: session.id })

    return { userId: input.userId, accessToken, refreshToken }
  })

export const refreshSession = (userId: string, refreshToken: string) =>
  Effect.gen(function* () {
    const sessions = yield* UserSessionsRepository
    const opaqueTokens = yield* OpaqueTokens
    const accessTokens = yield* AccessTokens

    const hash = opaqueTokens.hash(refreshToken)
    const found = yield* sessions.findByRefreshTokenHash(userId, hash)
    if (Option.isNone(found)) {
      return yield* Effect.fail(new SessionInvalid({ reason: "not_found" }))
    }

    const accessToken = yield* accessTokens.sign({ userId, sessionId: found.value.id })
    return { userId, accessToken, refreshToken }
  })

const revokeOwnedSession = (userId: string, sessionId: string) =>
  Effect.gen(function* () {
    const sessions = yield* UserSessionsRepository

    const found = yield* sessions.findById(sessionId)
    if (Option.isNone(found) || found.value.userId !== userId) {
      return yield* Effect.fail(new SessionInvalid({ reason: "not_found" }))
    }

    yield* sessions.revoke(sessionId)
  })

export const logout = (userId: string, sessionId: string) => revokeOwnedSession(userId, sessionId)

export const revokeSession = (userId: string, sessionId: string) =>
  revokeOwnedSession(userId, sessionId)

export const listSessions = (userId: string) =>
  Effect.gen(function* () {
    const sessions = yield* UserSessionsRepository
    return yield* sessions.listByUser(userId)
  })

export const revokeAllSessions = (userId: string) =>
  Effect.gen(function* () {
    const sessions = yield* UserSessionsRepository
    yield* sessions.revokeAllForUser(userId)
  })
