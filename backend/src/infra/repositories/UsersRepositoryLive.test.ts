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

  it("finds credentials by email, keeping the password hash", async () => {
    const { layer, queries } = makeTestSqlClient(() => [userRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UsersRepository
        return yield* repo.findCredentialsByEmail(userRow.email)
      }).pipe(Effect.provide(UsersRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    if (Option.isSome(decoded)) {
      expect(decoded.value.passwordHash).toBe(userRow.password_hash)
    }
    expect(queries[0]?.sql).toBe('SELECT * FROM "users" WHERE email = $1')
    expect(queries[0]?.params).toEqual([userRow.email])
  })

  it("finds credentials by id, keeping the password hash", async () => {
    const { layer, queries } = makeTestSqlClient(() => [userRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UsersRepository
        return yield* repo.findCredentialsById(userRow.id)
      }).pipe(Effect.provide(UsersRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    if (Option.isSome(decoded)) {
      expect(decoded.value.passwordHash).toBe(userRow.password_hash)
    }
    expect(queries[0]?.sql).toBe('SELECT * FROM "users" WHERE id = $1')
  })

  it("returns none when no user matches the email", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UsersRepository
        return yield* repo.findCredentialsByEmail("missing@example.com")
      }).pipe(Effect.provide(UsersRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isNone(decoded)).toBe(true)
  })

  it("marks a user's email verified", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UsersRepository
        return yield* repo.setEmailVerified(userRow.id)
      }).pipe(Effect.provide(UsersRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.sql).toBe(
      'UPDATE "users" SET "email_verified" = $1, "updated_at" = $2 WHERE id = $3',
    )
    expect(queries[0]?.params?.[0]).toBe(true)
    expect(queries[0]?.params?.[2]).toBe(userRow.id)
  })

  it("sets a new password hash", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UsersRepository
        return yield* repo.setPasswordHash(userRow.id, "new-hash")
      }).pipe(Effect.provide(UsersRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.sql).toBe(
      'UPDATE "users" SET "password_hash" = $1, "updated_at" = $2 WHERE id = $3',
    )
    expect(queries[0]?.params?.[0]).toBe("new-hash")
  })

  it("enrolls MFA by setting the secret and enabling it", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UsersRepository
        return yield* repo.setMfa(userRow.id, { secret: "base32secret", enabled: true })
      }).pipe(Effect.provide(UsersRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.sql).toBe(
      'UPDATE "users" SET "mfa_secret" = $1, "mfa_enabled" = $2, "updated_at" = $3 WHERE id = $4',
    )
    expect(queries[0]?.params).toEqual(["base32secret", true, expect.any(Date), userRow.id])
  })

  it("disables MFA by clearing the secret", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* UsersRepository
        return yield* repo.setMfa(userRow.id, { secret: null, enabled: false })
      }).pipe(Effect.provide(UsersRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.params).toEqual([null, false, expect.any(Date), userRow.id])
  })
})
