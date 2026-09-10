import { describe, expect, it } from "@jest/globals"
import { Effect, Option } from "effect"
import { SharedPaymentsRepository } from "../../data/protocols/SharedPaymentsRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { SharedPaymentsRepositoryLive } from "./SharedPaymentsRepositoryLive"

const now = new Date("2026-01-01T00:00:00.000Z")

const paymentRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  household_id: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  cycle_id: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
  account_id: "8c9e6679-7425-40de-944b-e07fc1f90aea",
  booked_at: new Date("2026-01-05T00:00:00.000Z"),
  description: "Mercado",
  counterparty: null,
  amount_minor: 10_000,
  currency: "EUR",
  amount_base_minor: 10_000,
  fx_rate: null,
  category_id: "8c9e6679-7425-40de-944b-e07fc1f90aeb",
  created_by: "8c9e6679-7425-40de-944b-e07fc1f90aec",
  created_at: now,
  updated_at: now,
}

const run = <A>(
  effect: Effect.Effect<A, unknown, SharedPaymentsRepository>,
  layer: ReturnType<typeof makeTestSqlClient>["layer"],
) =>
  Effect.runPromise(
    effect.pipe(Effect.provide(SharedPaymentsRepositoryLive), Effect.provide(layer)),
  )

describe("SharedPaymentsRepositoryLive", () => {
  it("creates a shared payment", async () => {
    const { layer, queries } = makeTestSqlClient(() => [paymentRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* SharedPaymentsRepository
        return yield* repo.create({
          householdId: paymentRow.household_id,
          cycleId: paymentRow.cycle_id,
          accountId: paymentRow.account_id,
          bookedAt: paymentRow.booked_at,
          description: "Mercado",
          counterparty: null,
          amountMinor: 10_000,
          currency: "EUR",
          amountBaseMinor: 10_000,
          fxRate: null,
          categoryId: paymentRow.category_id,
          createdBy: paymentRow.created_by,
        })
      }),
      layer,
    )
    expect(decoded.description).toBe("Mercado")
    expect(queries[0]?.sql).toContain('INSERT INTO "shared_payments"')
  })

  it("finds a shared payment by id", async () => {
    const { layer } = makeTestSqlClient(() => [paymentRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* SharedPaymentsRepository
        return yield* repo.findById(paymentRow.id)
      }),
      layer,
    )
    expect(Option.isSome(decoded)).toBe(true)
  })

  it("returns none when no shared payment matches the id", async () => {
    const { layer } = makeTestSqlClient(() => [])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* SharedPaymentsRepository
        return yield* repo.findById("missing")
      }),
      layer,
    )
    expect(Option.isNone(decoded)).toBe(true)
  })

  it("lists shared payments for a cycle ordered by booked date", async () => {
    const { layer, queries } = makeTestSqlClient(() => [paymentRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* SharedPaymentsRepository
        return yield* repo.listByCycle(paymentRow.cycle_id)
      }),
      layer,
    )
    expect(decoded).toHaveLength(1)
    expect(queries[0]?.sql).toContain('ORDER BY "booked_at" ASC')
  })

  it("updates a shared payment", async () => {
    const { layer, queries } = makeTestSqlClient(() => [{ ...paymentRow, description: "Feira" }])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* SharedPaymentsRepository
        return yield* repo.update(paymentRow.id, {
          description: "Feira",
          counterparty: null,
          amountMinor: 10_000,
          amountBaseMinor: 10_000,
          fxRate: null,
          categoryId: paymentRow.category_id,
        })
      }),
      layer,
    )
    expect(decoded.description).toBe("Feira")
    expect(queries[0]?.sql).toContain('UPDATE "shared_payments"')
  })

  it("removes a shared payment", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])
    await run(
      Effect.gen(function* () {
        const repo = yield* SharedPaymentsRepository
        return yield* repo.remove(paymentRow.id)
      }),
      layer,
    )
    expect(queries[0]?.sql).toContain('DELETE FROM "shared_payments"')
  })
})
