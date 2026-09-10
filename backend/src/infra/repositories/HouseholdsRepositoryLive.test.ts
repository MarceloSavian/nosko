import { describe, expect, it } from "@jest/globals"
import { Effect, Option } from "effect"
import { HouseholdsRepository } from "../../data/protocols/HouseholdsRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { HouseholdsRepositoryLive } from "./HouseholdsRepositoryLive"

const now = new Date("2026-01-01T00:00:00.000Z")

const householdRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  name: "Casa Marcelo & Gabriele",
  base_currency: "EUR",
  created_by: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  created_at: now,
  updated_at: now,
}

const memberRow = {
  household_id: householdRow.id,
  user_id: householdRow.created_by,
  role: "owner",
  display_name: null,
  joined_at: now,
}

const settingsRow = {
  household_id: householdRow.id,
  cycle_anchor_day: 23,
  locale: "pt-BR",
  base_currency: "EUR",
  default_reserve_minor: 0,
  box3_allowance_minor: 5_700_000,
  box3_rate: 0.0216,
  inflation_rate: 0,
  updated_at: now,
}

describe("HouseholdsRepositoryLive", () => {
  it("creates a household, seeds its settings, and adds the creator as owner", async () => {
    const { layer, queries } = makeTestSqlClient((query) =>
      query.sql.startsWith('INSERT INTO "households"') ? [householdRow] : [],
    )

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.create({
          name: householdRow.name,
          baseCurrency: householdRow.base_currency,
          createdBy: householdRow.created_by,
        })
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.id).toBe(householdRow.id)
    expect(queries.map((q) => q.sql)).toEqual([
      "BEGIN",
      'INSERT INTO "households" ("name","base_currency","created_by") VALUES ($1,$2,$3) RETURNING *',
      "select set_config('app.household_id', $1, true)",
      'INSERT INTO "household_settings" ("household_id") VALUES ($1)',
      'INSERT INTO "household_members" ("household_id","user_id","role") VALUES ($1,$2,$3)',
      "COMMIT",
    ])
    expect(queries[4]?.params).toEqual([householdRow.id, householdRow.created_by, "owner"])
  })

  it("finds a household by id", async () => {
    const { layer, queries } = makeTestSqlClient(() => [householdRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.findById(householdRow.id)
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toBe('SELECT * FROM "households" WHERE id = $1')
  })

  it("updates a household's name and base currency", async () => {
    const { layer, queries } = makeTestSqlClient(() => [
      { ...householdRow, name: "Casa Nova", base_currency: "BRL" },
    ])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.update(householdRow.id, { name: "Casa Nova", baseCurrency: "BRL" })
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.name).toBe("Casa Nova")
    expect(queries[0]?.sql).toBe(
      'UPDATE "households" SET "name" = $1, "base_currency" = $2, "updated_at" = $3 WHERE id = $4 RETURNING *',
    )
    expect(queries[0]?.params?.[3]).toBe(householdRow.id)
  })

  it("returns none when no household matches the id", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.findById("missing")
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isNone(decoded)).toBe(true)
  })

  it("adds a member to a household", async () => {
    const { layer, queries } = makeTestSqlClient(() => [memberRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.addMember({
          householdId: householdRow.id,
          userId: householdRow.created_by,
          role: "owner",
          displayName: null,
        })
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.role).toBe("owner")
    expect(queries[0]?.sql).toBe(
      'INSERT INTO "household_members" ("household_id","user_id","role","display_name") VALUES ($1,$2,$3,$4) RETURNING *',
    )
  })

  it("lists members of a household", async () => {
    const { layer, queries } = makeTestSqlClient(() => [memberRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.listMembers(householdRow.id)
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded).toHaveLength(1)
    expect(queries[0]?.sql).toBe('SELECT * FROM "household_members" WHERE "household_id" = $1')
  })

  it("removes a member from a household", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.removeMember(householdRow.id, householdRow.created_by)
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.sql).toBe(
      'DELETE FROM "household_members" WHERE "household_id" = $1 AND "user_id" = $2',
    )
    expect(queries[0]?.params).toEqual([householdRow.id, householdRow.created_by])
  })

  it("finds a user's household membership by user id", async () => {
    const { layer, queries } = makeTestSqlClient(() => [memberRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.findMembershipByUserId(householdRow.created_by)
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toBe('SELECT * FROM "household_members" WHERE "user_id" = $1 LIMIT 1')
    expect(queries[0]?.params).toEqual([householdRow.created_by])
  })

  it("returns none when the user has no household membership", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.findMembershipByUserId("nobody")
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isNone(decoded)).toBe(true)
  })

  it("finds a household's settings", async () => {
    const { layer, queries } = makeTestSqlClient(() => [settingsRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.findSettings(householdRow.id)
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toBe('SELECT * FROM "household_settings" WHERE "household_id" = $1')
    expect(queries[0]?.params).toEqual([householdRow.id])
  })

  it("returns none when a household has no settings row", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* HouseholdsRepository
        return yield* repo.findSettings("missing")
      }).pipe(Effect.provide(HouseholdsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isNone(decoded)).toBe(true)
  })
})
