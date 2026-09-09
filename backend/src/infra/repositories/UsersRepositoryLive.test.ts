import { describe, expect, it } from "@jest/globals"
import { DateTime, Effect, Option } from "effect"
import { UsersRepository } from "../../data/protocols/UsersRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { UsersRepositoryLive } from "./UsersRepositoryLive"

const now = new Date("2026-01-01T00:00:00.000Z")

const userRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  email: "marcelo@example.com",
  password_hash: "argon2id$...",
  name: "Marcelo",
  preferred_locale: "pt-BR",
  email_verified: false,
  mfa_enabled: false,
  mfa_secret: null,
  created_at: now,
  updated_at: now,
}

describe("UsersRepositoryLive", () => {
  it("creates a user and strips sensitive columns from the decoded result", async () => {
    const { layer, queries } = makeTestSqlClient(() => [userRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UsersRepository
        return yield* repo.create({
          email: "marcelo@example.com",
          passwordHash: "argon2id$...",
          name: "Marcelo",
          preferredLocale: "pt-BR",
        })
      }).pipe(Effect.provide(UsersRepositoryLive), Effect.provide(layer)),
    )

    expect({
      ...decoded,
      createdAt: DateTime.toDateUtc(decoded.createdAt),
      updatedAt: DateTime.toDateUtc(decoded.updatedAt),
    }).toEqual({
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      preferredLocale: userRow.preferred_locale,
      emailVerified: false,
      mfaEnabled: false,
      createdAt: now,
      updatedAt: now,
    })
    expect(queries).toHaveLength(1)
    expect(queries[0]?.sql).toBe(
      'INSERT INTO "users" ("email","password_hash","name","preferred_locale") VALUES ($1,$2,$3,$4) RETURNING *',
    )
    expect(queries[0]?.params).toEqual(["marcelo@example.com", "argon2id$...", "Marcelo", "pt-BR"])
  })

  it("finds a user by id", async () => {
    const { layer, queries } = makeTestSqlClient(() => [userRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UsersRepository
        return yield* repo.findById(userRow.id)
      }).pipe(Effect.provide(UsersRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toBe('SELECT * FROM "users" WHERE id = $1')
    expect(queries[0]?.params).toEqual([userRow.id])
  })

  it("returns none when no user matches the id", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UsersRepository
        return yield* repo.findById("missing")
      }).pipe(Effect.provide(UsersRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isNone(decoded)).toBe(true)
  })
})
