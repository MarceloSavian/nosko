import { describe, expect, it } from "@jest/globals"
import { Effect, Option } from "effect"
import { CyclesRepository } from "../../data/protocols/CyclesRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { CyclesRepositoryLive } from "./CyclesRepositoryLive"

const now = new Date("2026-01-01T00:00:00.000Z")

const cycleRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  household_id: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  cycle_key: "2026-01",
  title: null,
  start_date: new Date("2025-12-23T00:00:00.000Z"),
  end_date: new Date("2026-01-22T00:00:00.000Z"),
  status: "open",
  closed_at: null,
  reserve_minor: 20_000,
  estimate_minor: null,
  seed_opening_balance_minor: null,
  surplus_goal_id: null,
  surplus_destination_label: null,
  created_at: now,
  updated_at: now,
}

const incomeRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
  cycle_id: cycleRow.id,
  member_user_id: cycleRow.household_id,
  kind: "salary",
  amount_minor: 300_000,
  currency: "EUR",
  created_at: now,
  updated_at: now,
}

const transferRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90aea",
  cycle_id: cycleRow.id,
  member_user_id: cycleRow.household_id,
  direction: "to_personal",
  amount_minor: 50_000,
  currency: "EUR",
  settled_at: null,
  method: null,
  created_at: now,
}

const run = <A>(
  effect: Effect.Effect<A, unknown, CyclesRepository>,
  layer: ReturnType<typeof makeTestSqlClient>["layer"],
) => Effect.runPromise(effect.pipe(Effect.provide(CyclesRepositoryLive), Effect.provide(layer)))

describe("CyclesRepositoryLive", () => {
  it("creates a cycle", async () => {
    const { layer, queries } = makeTestSqlClient(() => [cycleRow])

    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.create({
          householdId: cycleRow.household_id,
          cycleKey: cycleRow.cycle_key,
          title: null,
          startDate: cycleRow.start_date,
          endDate: cycleRow.end_date,
          reserveMinor: 20_000,
          estimateMinor: null,
          seedOpeningBalanceMinor: null,
        })
      }),
      layer,
    )

    expect(decoded.cycleKey).toBe("2026-01")
    expect(queries[0]?.sql).toContain('INSERT INTO "cycles"')
  })

  it("finds a cycle by id", async () => {
    const { layer } = makeTestSqlClient(() => [cycleRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.findById(cycleRow.id)
      }),
      layer,
    )
    expect(Option.isSome(decoded)).toBe(true)
  })

  it("returns none when no cycle matches", async () => {
    const { layer } = makeTestSqlClient(() => [])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.findById("missing")
      }),
      layer,
    )
    expect(Option.isNone(decoded)).toBe(true)
  })

  it("finds a cycle by household and cycle key", async () => {
    const { layer, queries } = makeTestSqlClient(() => [cycleRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.findByCycleKey(cycleRow.household_id, cycleRow.cycle_key)
      }),
      layer,
    )
    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toContain('"household_id" = $1 AND "cycle_key" = $2')
  })

  it("lists cycles ordered by start date ascending", async () => {
    const { layer, queries } = makeTestSqlClient(() => [cycleRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.list()
      }),
      layer,
    )
    expect(decoded).toHaveLength(1)
    expect(queries[0]?.sql).toContain('ORDER BY "start_date" ASC')
  })

  it("finds the cycle containing today", async () => {
    const { layer, queries } = makeTestSqlClient(() => [cycleRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.findCurrent(new Date("2026-01-05T00:00:00.000Z"))
      }),
      layer,
    )
    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toContain('"start_date" <= $1 AND "end_date" >= $2')
  })

  it("updates a cycle", async () => {
    const { layer, queries } = makeTestSqlClient(() => [{ ...cycleRow, title: "Janeiro" }])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.update(cycleRow.id, {
          title: "Janeiro",
          reserveMinor: 20_000,
          estimateMinor: null,
          surplusGoalId: null,
          surplusDestinationLabel: null,
        })
      }),
      layer,
    )
    expect(decoded.title).toBe("Janeiro")
    expect(queries[0]?.sql).toContain('UPDATE "cycles"')
  })

  it("closes a cycle", async () => {
    const { layer, queries } = makeTestSqlClient(() => [
      { ...cycleRow, status: "closed", closed_at: now },
    ])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.close(cycleRow.id)
      }),
      layer,
    )
    expect(decoded.status).toBe("closed")
    expect(queries[0]?.sql).toContain('"status" = $1')
  })

  it("lists incomes for a cycle", async () => {
    const { layer, queries } = makeTestSqlClient(() => [incomeRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.listIncomes(cycleRow.id)
      }),
      layer,
    )
    expect(decoded).toHaveLength(1)
    expect(queries[0]?.sql).toContain('"cycle_id" = $1')
  })

  it("upserts a member's income for a cycle", async () => {
    const { layer, queries } = makeTestSqlClient(() => [incomeRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.setIncome({
          cycleId: cycleRow.id,
          householdId: cycleRow.household_id,
          memberUserId: incomeRow.member_user_id,
          kind: "salary",
          amountMinor: 300_000,
          currency: "EUR",
        })
      }),
      layer,
    )
    expect(decoded.amountMinor).toBe(300_000)
    expect(queries[0]?.sql).toContain("ON CONFLICT (cycle_id, member_user_id, kind) DO UPDATE")
  })

  it("lists transfers for a cycle", async () => {
    const { layer, queries } = makeTestSqlClient(() => [transferRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.listTransfers(cycleRow.id)
      }),
      layer,
    )
    expect(decoded).toHaveLength(1)
    expect(queries[0]?.sql).toContain('"cycle_id" = $1')
  })

  it("finds a transfer by id", async () => {
    const { layer } = makeTestSqlClient(() => [transferRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.findTransferById(transferRow.id)
      }),
      layer,
    )
    expect(Option.isSome(decoded)).toBe(true)
  })

  it("returns none when no transfer matches the id", async () => {
    const { layer } = makeTestSqlClient(() => [])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.findTransferById("missing")
      }),
      layer,
    )
    expect(Option.isNone(decoded)).toBe(true)
  })

  it("records a member transfer", async () => {
    const { layer, queries } = makeTestSqlClient(() => [transferRow])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.recordTransfer({
          cycleId: cycleRow.id,
          householdId: cycleRow.household_id,
          memberUserId: transferRow.member_user_id,
          direction: "to_personal",
          amountMinor: 50_000,
          currency: "EUR",
          method: null,
        })
      }),
      layer,
    )
    expect(decoded.amountMinor).toBe(50_000)
    expect(queries[0]?.sql).toContain('INSERT INTO "member_transfers"')
  })

  it("settles a transfer", async () => {
    const { layer, queries } = makeTestSqlClient(() => [{ ...transferRow, settled_at: now }])
    const decoded = await run(
      Effect.gen(function* () {
        const repo = yield* CyclesRepository
        return yield* repo.settleTransfer(transferRow.id)
      }),
      layer,
    )
    expect(decoded.settledAt).not.toBeNull()
    expect(queries[0]?.sql).toContain('"settled_at" = $1')
  })
})
