import { describe, expect, it } from "@jest/globals"
import { Effect, Exit, Layer } from "effect"
import { computeCycleWindow } from "../../domain/services/CycleEngine"
import {
  makeFakeCyclesRepository,
  makeFakeFixedBillsRepository,
  makeFakeRecurringRulesRepository,
} from "../../test/fakeRepositories"
import { CyclesRepository } from "../protocols/CyclesRepository"
import { RecurringRulesRepository } from "../protocols/RecurringRulesRepository"
import { createCycleWithScaffold, figuresForAllCycles } from "./Cycles"

const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"

describe("figuresForAllCycles", () => {
  it("chains estimate and surplus forward across cycles in start-date order", async () => {
    const cyclesFake = makeFakeCyclesRepository()
    const billsFake = makeFakeFixedBillsRepository()
    const layer = Layer.mergeAll(cyclesFake.layer, billsFake.layer)

    const run = <A>(effect: Effect.Effect<A, unknown, CyclesRepository>) =>
      Effect.runPromise(effect.pipe(Effect.provide(layer)))

    const firstCycle = await run(
      Effect.gen(function* () {
        const cyclesRepo = yield* CyclesRepository
        return yield* cyclesRepo.create({
          householdId,
          cycleKey: "2026-01",
          title: null,
          startDate: new Date("2025-12-23T00:00:00.000Z"),
          endDate: new Date("2026-01-22T00:00:00.000Z"),
          reserveMinor: 10_000,
          estimateMinor: 40_000,
          seedOpeningBalanceMinor: 5_000,
        })
      }),
    )

    const secondCycle = await run(
      Effect.gen(function* () {
        const cyclesRepo = yield* CyclesRepository
        return yield* cyclesRepo.create({
          householdId,
          cycleKey: "2026-02",
          title: null,
          startDate: new Date("2026-01-23T00:00:00.000Z"),
          endDate: new Date("2026-02-22T00:00:00.000Z"),
          reserveMinor: 10_000,
          estimateMinor: null,
          seedOpeningBalanceMinor: null,
        })
      }),
    )

    await run(
      Effect.gen(function* () {
        const cyclesRepo = yield* CyclesRepository
        yield* cyclesRepo.setIncome({
          cycleId: firstCycle.id,
          householdId,
          memberUserId: "member-a",
          kind: "salary",
          amountMinor: 300_000,
          currency: "EUR",
        })
      }),
    )

    const results = await Effect.runPromise(figuresForAllCycles.pipe(Effect.provide(layer)))

    expect(results).toHaveLength(2)
    expect(results[0]?.cycle.id).toBe(firstCycle.id)
    expect(results[0]?.figures.estimate).toBe(40_000)
    expect(results[1]?.cycle.id).toBe(secondCycle.id)
    expect(results[1]?.figures.estimate).toBe(results[0]?.figures.variableTotal)
    expect(results[1]?.figures.openingBalance).toBe(results[0]?.figures.surplus)
  })
})

describe("createCycleWithScaffold", () => {
  it("creates a cycle and scaffolds fixed bills from active fixed-bill rules", async () => {
    const cyclesFake = makeFakeCyclesRepository()
    const billsFake = makeFakeFixedBillsRepository()
    const rulesFake = makeFakeRecurringRulesRepository()
    const layer = Layer.mergeAll(cyclesFake.layer, billsFake.layer, rulesFake.layer)

    const rule = await Effect.runPromise(
      Effect.gen(function* () {
        const rulesRepo = yield* RecurringRulesRepository
        return yield* rulesRepo.create({
          householdId,
          matchType: "vendor_exact",
          matcher: "Aluguel",
          expectedAmountMinor: 150_000,
          currency: "EUR",
          categoryId: null,
          cadence: "monthly",
          isFixedBill: true,
        })
      }).pipe(Effect.provide(layer)),
    )

    const ruleWithoutAmount = await Effect.runPromise(
      Effect.gen(function* () {
        const rulesRepo = yield* RecurringRulesRepository
        return yield* rulesRepo.create({
          householdId,
          matchType: "vendor_exact",
          matcher: "Ginasio",
          expectedAmountMinor: null,
          currency: null,
          categoryId: null,
          cadence: "monthly",
          isFixedBill: true,
        })
      }).pipe(Effect.provide(layer)),
    )

    const window = computeCycleWindow(23, new Date())

    const cycle = await Effect.runPromise(
      createCycleWithScaffold({
        householdId,
        anchorDay: 23,
        baseCurrency: "EUR",
        title: null,
        reserveMinor: 20_000,
        estimateMinor: null,
        seedOpeningBalanceMinor: null,
      }).pipe(Effect.provide(layer)),
    )

    expect(cycle.cycleKey).toBe(window.cycleKey)

    const bills = [...billsFake.bills.values()]
    expect(bills).toHaveLength(2)
    const rentBill = bills.find((b) => b.recurringRuleId === rule.id)
    expect(rentBill?.amountMinor).toBe(150_000)
    const gymBill = bills.find((b) => b.recurringRuleId === ruleWithoutAmount.id)
    expect(gymBill?.amountMinor).toBe(0)
    expect(gymBill?.currency).toBe("EUR")
  })

  it("fails with CycleAlreadyExists when a cycle already covers the window", async () => {
    const cyclesFake = makeFakeCyclesRepository()
    const billsFake = makeFakeFixedBillsRepository()
    const rulesFake = makeFakeRecurringRulesRepository()
    const layer = Layer.mergeAll(cyclesFake.layer, billsFake.layer, rulesFake.layer)

    const window = computeCycleWindow(23, new Date())

    await Effect.runPromise(
      Effect.gen(function* () {
        const cyclesRepo = yield* CyclesRepository
        yield* cyclesRepo.create({
          householdId,
          cycleKey: window.cycleKey,
          title: null,
          startDate: window.startDate,
          endDate: window.endDate,
          reserveMinor: 0,
          estimateMinor: null,
          seedOpeningBalanceMinor: null,
        })
      }).pipe(Effect.provide(layer)),
    )

    const exit = await Effect.runPromiseExit(
      createCycleWithScaffold({
        householdId,
        anchorDay: 23,
        baseCurrency: "EUR",
        title: null,
        reserveMinor: 0,
        estimateMinor: null,
        seedOpeningBalanceMinor: null,
      }).pipe(Effect.provide(layer)),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })
})
