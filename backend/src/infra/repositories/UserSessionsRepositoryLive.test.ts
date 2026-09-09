import { describe, expect, it } from "@jest/globals"
import { Effect, Option } from "effect"
import { UserSessionsRepository } from "../../data/protocols/UserSessionsRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { UserSessionsRepositoryLive } from "./UserSessionsRepositoryLive"

const now = new Date("2026-01-01T00:00:00.000Z")
const later = new Date("2026-01-31T00:00:00.000Z")

const sessionRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  user_id: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  refresh_token_hash: "sha256-hash",
  device_label: null,
  mfa_trusted_until: null,
  expires_at: later,
  revoked_at: null,
  created_at: now,
}

describe("UserSessionsRepositoryLive", () => {
  it("creates a session", async () => {
    const { layer, queries } = makeTestSqlClient(() => [sessionRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UserSessionsRepository
        return yield* repo.create({
          userId: sessionRow.user_id,
          refreshTokenHash: "sha256-hash",
          deviceLabel: null,
          mfaTrustedUntil: null,
          expiresAt: later,
        })
      }).pipe(Effect.provide(UserSessionsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.userId).toBe(sessionRow.user_id)
    expect(queries[0]?.sql).toBe(
      'INSERT INTO "user_sessions" ("user_id","refresh_token_hash","device_label","mfa_trusted_until","expires_at") VALUES ($1,$2,$3,$4,$5) RETURNING *',
    )
  })

  it("finds a session by id", async () => {
    const { layer, queries } = makeTestSqlClient(() => [sessionRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UserSessionsRepository
        return yield* repo.findById(sessionRow.id)
      }).pipe(Effect.provide(UserSessionsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toBe('SELECT * FROM "user_sessions" WHERE id = $1')
  })

  it("finds an active session by refresh token hash", async () => {
    const { layer, queries } = makeTestSqlClient(() => [sessionRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UserSessionsRepository
        return yield* repo.findByRefreshTokenHash(sessionRow.user_id, "sha256-hash")
      }).pipe(Effect.provide(UserSessionsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toContain('"refresh_token_hash" = $2')
    expect(queries[0]?.sql).toContain('"revoked_at" IS NULL')
    expect(queries[0]?.sql).toContain('"expires_at" > now()')
  })

  it("returns none when the refresh token does not match an active session", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UserSessionsRepository
        return yield* repo.findByRefreshTokenHash(sessionRow.user_id, "wrong")
      }).pipe(Effect.provide(UserSessionsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isNone(decoded)).toBe(true)
  })

  it("lists sessions for a user, newest first", async () => {
    const { layer, queries } = makeTestSqlClient(() => [sessionRow, sessionRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UserSessionsRepository
        return yield* repo.listByUser(sessionRow.user_id)
      }).pipe(Effect.provide(UserSessionsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded).toHaveLength(2)
    expect(queries[0]?.sql).toBe(
      'SELECT * FROM "user_sessions" WHERE "user_id" = $1 ORDER BY "created_at" DESC',
    )
  })

  it("revokes a session", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UserSessionsRepository
        return yield* repo.revoke(sessionRow.id)
      }).pipe(Effect.provide(UserSessionsRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.sql).toBe('UPDATE "user_sessions" SET "revoked_at" = $1 WHERE id = $2')
  })

  it("revokes every active session for a user", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UserSessionsRepository
        return yield* repo.revokeAllForUser(sessionRow.user_id)
      }).pipe(Effect.provide(UserSessionsRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.sql).toBe(
      'UPDATE "user_sessions" SET "revoked_at" = $1 WHERE "user_id" = $2 AND "revoked_at" IS NULL',
    )
  })
})
