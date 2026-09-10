import { describe, expect, it } from "@jest/globals"
import { Effect, Option } from "effect"
import { FixedBillsRepository } from "../../data/protocols/FixedBillsRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { FixedBillsRepositoryLive } from "./FixedBillsRepositoryLive"

const now = new Date("2026-01-01T00:00:00.000Z")

const billRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  cycle_id: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  recurring_rule_id: null,
  label: "Aluguel",
  amount_minor: 150_000,
  currency: "EUR",
  paid: false,
  paid_on_day: null,
  paying_account_id: null,
  due_day: 5,
  auto_paid: false,
  category_id: null,
  sort_order: 0,
  created_at: now,
  updated_at: now,
}

const run = <A>(
  effect: Effect.Effect<A, unknown, FixedBillsRepository>,
  layer: ReturnType<typeof makeTestSqlClient>["layer"],
) => Effect.runPromise(effect.pipe(Effect.provide(FixedBillsRepositoryLive), Effect.provide(layer)))

describe("FixedBillsRepositoryLive", () => {
  it("creates a fixed bill", async () => {
    const { layer, queries } = makeTestSqlClient(() => [billRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* FixedBillsRepository
        return yield* repo.create({
          cycleId: billRow.cycle_id,
          householdId: "household-1",
          recurringRuleId: null,
          label: "Aluguel",
          amountMinor: 150_000,
          currency: "EUR",
          payingAccountId: null,
          dueDay: 5,
          categoryId: null,
          sortOrder: 0,
        })
      }),
      layer,
    )
    expect(decoded.label).toBe("Aluguel")
    expect(queries[0]?.sql).toContain('INSERT INTO "fixed_bills"')
  })

  it("finds a fixed bill by id", async () => {
    const { layer } = makeTestSqlClient(() => [billRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* FixedBillsRepository
        return yield* repo.findById(billRow.id)
      }),
      layer,
    )
    expect(Option.isSome(decoded)).toBe(true)
  })

  it("returns none when no fixed bill matches the id", async () => {
    const { layer } = makeTestSqlClient(() => [])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* FixedBillsRepository
        return yield* repo.findById("missing")
      }),
      layer,
    )
    expect(Option.isNone(decoded)).toBe(true)
  })

  it("lists fixed bills for a cycle ordered by sort order", async () => {
    const { layer, queries } = makeTestSqlClient(() => [billRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* FixedBillsRepository
        return yield* repo.listByCycle(billRow.cycle_id)
      }),
      layer,
    )
    expect(decoded).toHaveLength(1)
    expect(queries[0]?.sql).toContain('ORDER BY "sort_order" ASC')
  })

  it("updates a fixed bill", async () => {
    const { layer, queries } = makeTestSqlClient(() => [{ ...billRow, label: "Aluguel novo" }])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* FixedBillsRepository
        return yield* repo.update(billRow.id, {
          label: "Aluguel novo",
          amountMinor: 150_000,
          payingAccountId: null,
          dueDay: 5,
          categoryId: null,
          sortOrder: 0,
        })
      }),
      layer,
    )
    expect(decoded.label).toBe("Aluguel novo")
    expect(queries[0]?.sql).toContain('UPDATE "fixed_bills"')
  })

  it("marks a fixed bill paid", async () => {
    const { layer, queries } = makeTestSqlClient(() => [{ ...billRow, paid: true, paid_on_day: 5 }])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* FixedBillsRepository
        return yield* repo.setPaid(billRow.id, true, 5)
      }),
      layer,
    )
    expect(decoded.paid).toBe(true)
    expect(queries[0]?.sql).toContain('"paid" = $1')
  })

  it("removes a fixed bill", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])
    await run(
      Effect.gen(function* () {
        const repo = yield* FixedBillsRepository
        return yield* repo.remove(billRow.id)
      }),
      layer,
    )
    expect(queries[0]?.sql).toContain('DELETE FROM "fixed_bills"')
  })
})
