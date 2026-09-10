import { describe, expect, it } from "@jest/globals"
import { Effect, Option } from "effect"
import { RecurringRulesRepository } from "../../data/protocols/RecurringRulesRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { RecurringRulesRepositoryLive } from "./RecurringRulesRepositoryLive"

const now = new Date("2026-01-01T00:00:00.000Z")

const ruleRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  household_id: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  match_type: "vendor_exact",
  matcher: "netflix",
  expected_amount_minor: 10_000,
  currency: "EUR",
  category_id: null,
  cadence: "monthly",
  is_fixed_bill: true,
  active: true,
  source: "user_defined",
  confidence: null,
  created_at: now,
  updated_at: now,
}

const run = <A>(
  effect: Effect.Effect<A, unknown, RecurringRulesRepository>,
  layer: ReturnType<typeof makeTestSqlClient>["layer"],
) =>
  Effect.runPromise(
    effect.pipe(Effect.provide(RecurringRulesRepositoryLive), Effect.provide(layer)),
  )

describe("RecurringRulesRepositoryLive", () => {
  it("creates a rule as user-defined", async () => {
    const { layer, queries } = makeTestSqlClient(() => [ruleRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* RecurringRulesRepository
        return yield* repo.create({
          householdId: ruleRow.household_id,
          matchType: "vendor_exact",
          matcher: "netflix",
          expectedAmountMinor: 10_000,
          currency: "EUR",
          categoryId: null,
          cadence: "monthly",
          isFixedBill: true,
        })
      }),
      layer,
    )
    expect(decoded.source).toBe("user_defined")
    expect(queries[0]?.sql).toContain('INSERT INTO "recurring_rules"')
  })

  it("finds a rule by id", async () => {
    const { layer } = makeTestSqlClient(() => [ruleRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* RecurringRulesRepository
        return yield* repo.findById(ruleRow.id)
      }),
      layer,
    )
    expect(Option.isSome(decoded)).toBe(true)
  })

  it("returns none when no rule matches the id", async () => {
    const { layer } = makeTestSqlClient(() => [])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* RecurringRulesRepository
        return yield* repo.findById("missing")
      }),
      layer,
    )
    expect(Option.isNone(decoded)).toBe(true)
  })

  it("lists all rules", async () => {
    const { layer, queries } = makeTestSqlClient(() => [ruleRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* RecurringRulesRepository
        return yield* repo.list()
      }),
      layer,
    )
    expect(decoded).toHaveLength(1)
    expect(queries[0]?.sql).toContain('ORDER BY "created_at" DESC')
  })

  it("lists active fixed-bill rules", async () => {
    const { layer, queries } = makeTestSqlClient(() => [ruleRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* RecurringRulesRepository
        return yield* repo.listActiveFixedBillRules()
      }),
      layer,
    )
    expect(decoded).toHaveLength(1)
    expect(queries[0]?.sql).toContain('active = true AND "is_fixed_bill" = true')
  })

  it("updates a rule", async () => {
    const { layer, queries } = makeTestSqlClient(() => [{ ...ruleRow, matcher: "netflix.com" }])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* RecurringRulesRepository
        return yield* repo.update(ruleRow.id, {
          matcher: "netflix.com",
          expectedAmountMinor: 10_000,
          currency: "EUR",
          categoryId: null,
          cadence: "monthly",
          isFixedBill: true,
        })
      }),
      layer,
    )
    expect(decoded.matcher).toBe("netflix.com")
    expect(queries[0]?.sql).toContain('UPDATE "recurring_rules"')
  })

  it("deactivates a rule", async () => {
    const { layer, queries } = makeTestSqlClient(() => [{ ...ruleRow, active: false }])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* RecurringRulesRepository
        return yield* repo.deactivate(ruleRow.id)
      }),
      layer,
    )
    expect(decoded.active).toBe(false)
    expect(queries[0]?.sql).toContain('"active" = $1')
  })
})
