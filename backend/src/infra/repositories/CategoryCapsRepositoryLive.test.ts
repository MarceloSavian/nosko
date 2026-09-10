import { describe, expect, it } from "@jest/globals"
import { Effect } from "effect"
import { CategoryCapsRepository } from "../../data/protocols/CategoryCapsRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { CategoryCapsRepositoryLive } from "./CategoryCapsRepositoryLive"

const capRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  household_id: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  cycle_id: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
  category_id: "8c9e6679-7425-40de-944b-e07fc1f90aea",
  cap_minor: 40_000,
}

const run = <A>(
  effect: Effect.Effect<A, unknown, CategoryCapsRepository>,
  layer: ReturnType<typeof makeTestSqlClient>["layer"],
) =>
  Effect.runPromise(effect.pipe(Effect.provide(CategoryCapsRepositoryLive), Effect.provide(layer)))

describe("CategoryCapsRepositoryLive", () => {
  it("lists caps for a cycle", async () => {
    const { layer, queries } = makeTestSqlClient(() => [capRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CategoryCapsRepository
        return yield* repo.listByCycle(capRow.cycle_id)
      }),
      layer,
    )
    expect(decoded).toHaveLength(1)
    expect(queries[0]?.sql).toContain('"cycle_id" = $1')
  })

  it("replaces the caps for a cycle", async () => {
    const { layer, queries } = makeTestSqlClient((query) =>
      query.sql.startsWith('INSERT INTO "category_caps"') ? [capRow] : [],
    )
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CategoryCapsRepository
        return yield* repo.replaceForCycle(capRow.household_id, capRow.cycle_id, [
          { categoryId: capRow.category_id, capMinor: 40_000 },
        ])
      }),
      layer,
    )
    expect(decoded).toEqual([
      {
        id: capRow.id,
        householdId: capRow.household_id,
        cycleId: capRow.cycle_id,
        categoryId: capRow.category_id,
        capMinor: 40_000,
      },
    ])
    expect(queries.map((q) => q.sql)).toEqual([
      "BEGIN",
      'DELETE FROM "category_caps" WHERE "cycle_id" = $1',
      'INSERT INTO "category_caps" ("household_id","cycle_id","category_id","cap_minor") VALUES ($1,$2,$3,$4) RETURNING *',
      "COMMIT",
    ])
  })

  it("clears the caps for a cycle when given an empty list", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CategoryCapsRepository
        return yield* repo.replaceForCycle(capRow.household_id, capRow.cycle_id, [])
      }),
      layer,
    )
    expect(decoded).toEqual([])
    expect(queries.map((q) => q.sql)).toEqual([
      "BEGIN",
      'DELETE FROM "category_caps" WHERE "cycle_id" = $1',
      "COMMIT",
    ])
  })
})
