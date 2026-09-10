import { describe, expect, it } from "@jest/globals"
import { Effect, Option } from "effect"
import { AuthTokensRepository } from "../../data/protocols/AuthTokensRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthTokensRepositoryLive } from "./AuthTokensRepositoryLive"

const now = new Date("2026-01-01T00:00:00.000Z")
const later = new Date("2026-01-01T00:15:00.000Z")

const tokenRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  user_id: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  type: "email_verify",
  token_hash: "sha256-hash",
  expires_at: later,
  consumed_at: null,
  created_at: now,
}

describe("AuthTokensRepositoryLive", () => {
  it("creates an auth token", async () => {
    const { layer, queries } = makeTestSqlClient(() => [tokenRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AuthTokensRepository
        return yield* repo.create({
          userId: tokenRow.user_id,
          type: "email_verify",
          tokenHash: "sha256-hash",
          expiresAt: later,
        })
      }).pipe(Effect.provide(AuthTokensRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.type).toBe("email_verify")
    expect(queries.map((q) => q.sql)).toEqual([
      "select set_config('app.user_id', $1, true)",
      'INSERT INTO "auth_tokens" ("user_id","type","token_hash","expires_at") VALUES ($1,$2,$3,$4) RETURNING *',
    ])
    expect(queries[0]?.params).toEqual([tokenRow.user_id])
  })

  it("finds a valid, unconsumed, unexpired token", async () => {
    const { layer, queries } = makeTestSqlClient(() => [tokenRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AuthTokensRepository
        return yield* repo.findValid(tokenRow.user_id, "email_verify", "sha256-hash")
      }).pipe(Effect.provide(AuthTokensRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toBe("select set_config('app.user_id', $1, true)")
    expect(queries[1]?.sql).toContain('"user_id" = $1')
    expect(queries[1]?.sql).toContain('"consumed_at" IS NULL')
    expect(queries[1]?.sql).toContain('"expires_at" > now()')
    expect(queries[1]?.params).toEqual([tokenRow.user_id, "email_verify", "sha256-hash"])
  })

  it("returns none when no token matches", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AuthTokensRepository
        return yield* repo.findValid("missing", "email_verify", "nope")
      }).pipe(Effect.provide(AuthTokensRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isNone(decoded)).toBe(true)
  })

  it("consumes a token", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AuthTokensRepository
        return yield* repo.consume(tokenRow.id)
      }).pipe(Effect.provide(AuthTokensRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.sql).toBe('UPDATE "auth_tokens" SET "consumed_at" = $1 WHERE id = $2')
    expect(queries[0]?.params?.[1]).toBe(tokenRow.id)
  })
})
