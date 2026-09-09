import { describe, expect, it } from "@jest/globals"
import { Effect } from "effect"
import { CategoriesRepository } from "../../data/protocols/CategoriesRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { CategoriesRepositoryLive } from "./CategoriesRepositoryLive"

const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"
const ownerUserId = "8c9e6679-7425-40de-944b-e07fc1f90ae9"

const householdCategoryRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  household_id: householdId,
  scope: "household",
  owner_user_id: null,
  name: "Mercado & Feira",
  color: "#22c55e",
  sort_order: 0,
}

const personalCategoryRow = {
  ...householdCategoryRow,
  scope: "personal",
  owner_user_id: ownerUserId,
  name: "Lazer & Livros",
}

describe("CategoriesRepositoryLive", () => {
  it("creates a household-scoped category", async () => {
    const { layer, queries } = makeTestSqlClient(() => [householdCategoryRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* CategoriesRepository
        return yield* repo.createHousehold({
          householdId,
          name: "Mercado & Feira",
          color: "#22c55e",
          sortOrder: 0,
        })
      }).pipe(Effect.provide(CategoriesRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.scope).toBe("household")
    expect(decoded.ownerUserId).toBeNull()
    expect(queries[0]?.sql).toBe(
      'INSERT INTO "categories" ("household_id","scope","name","color","sort_order") VALUES ($1,$2,$3,$4,$5) RETURNING *',
    )
    expect(queries[0]?.params).toEqual([householdId, "household", "Mercado & Feira", "#22c55e", 0])
  })

  it("creates a personal-scoped category", async () => {
    const { layer, queries } = makeTestSqlClient(() => [personalCategoryRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* CategoriesRepository
        return yield* repo.createPersonal({
          householdId,
          ownerUserId,
          name: "Lazer & Livros",
          color: null,
          sortOrder: 1,
        })
      }).pipe(Effect.provide(CategoriesRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.scope).toBe("personal")
    expect(decoded.ownerUserId).toBe(ownerUserId)
    expect(queries[0]?.sql).toBe(
      'INSERT INTO "categories" ("household_id","scope","owner_user_id","name","color","sort_order") VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    )
  })

  it("lists categories visible to the current RLS scope", async () => {
    const { layer, queries } = makeTestSqlClient(() => [householdCategoryRow, personalCategoryRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* CategoriesRepository
        return yield* repo.list()
      }).pipe(Effect.provide(CategoriesRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded).toHaveLength(2)
    expect(queries[0]?.sql).toBe('SELECT * FROM "categories" ORDER BY "sort_order"')
  })
})
