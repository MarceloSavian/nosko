import { DateTime, Effect, Option } from "effect"
import { CycleAlreadyExists } from "../../domain/errors/CycleErrors"
import type { Cycle } from "../../domain/models/Cycle"
import {
  type CycleFigures,
  computeCycleFigures,
  computeCycleWindow,
} from "../../domain/services/CycleEngine"
import { CyclesRepository } from "../protocols/CyclesRepository"
import { FixedBillsRepository } from "../protocols/FixedBillsRepository"
import { RecurringRulesRepository } from "../protocols/RecurringRulesRepository"
import { SharedPaymentsRepository } from "../protocols/SharedPaymentsRepository"

export interface CycleWithFigures {
  readonly cycle: Cycle
  readonly figures: CycleFigures
}

const DAY_MS = 24 * 60 * 60 * 1000

export const figuresForAllCycles = Effect.gen(function* () {
  const cyclesRepo = yield* CyclesRepository
  const billsRepo = yield* FixedBillsRepository
  const paymentsRepo = yield* SharedPaymentsRepository

  const all = yield* cyclesRepo.list()
  const results: Array<CycleWithFigures> = []
  let prev: { variableTotal: number; surplus: number } | null = null
  const today = Date.now()

  for (const cycle of all) {
    const incomes = yield* cyclesRepo.listIncomes(cycle.id)
    const transfers = yield* cyclesRepo.listTransfers(cycle.id)
    const cycleBills = yield* billsRepo.listByCycle(cycle.id)
    const fixedTotal = cycleBills.reduce((sum, b) => sum + b.amountMinor, 0)
    const cyclePayments = yield* paymentsRepo.listByCycle(cycle.id)
    const variableTotal = cyclePayments.reduce((sum, p) => sum + p.amountBaseMinor, 0)

    const startMillis = DateTime.toEpochMillis(cycle.startDate)
    const endMillis = DateTime.toEpochMillis(cycle.endDate)
    const cycleDays = Math.round((endMillis - startMillis) / DAY_MS) + 1
    const daysUntilEnd = Math.max(Math.round((endMillis - today) / DAY_MS) + 1, 0)

    const figures = computeCycleFigures({
      incomes: incomes.map((i) => ({
        memberUserId: i.memberUserId,
        kind: i.kind,
        amountMinor: i.amountMinor,
      })),
      fixedTotal,
      reserveMinor: cycle.reserveMinor,
      estimateMinor: cycle.estimateMinor,
      seedOpeningBalanceMinor: cycle.seedOpeningBalanceMinor,
      prev,
      transfers: transfers.map((t) => ({ direction: t.direction, amountMinor: t.amountMinor })),
      variableTotal,
      cycleDays,
      daysUntilEnd,
    })

    results.push({ cycle, figures })
    prev = { variableTotal: figures.variableTotal, surplus: figures.surplus }
  }

  return results
})

export interface CreateCycleInput {
  readonly householdId: string
  readonly anchorDay: number
  readonly baseCurrency: string
  readonly title: string | null
  readonly reserveMinor: number
  readonly estimateMinor: number | null
  readonly seedOpeningBalanceMinor: number | null
}

export const createCycleWithScaffold = (input: CreateCycleInput) =>
  Effect.gen(function* () {
    const cyclesRepo = yield* CyclesRepository
    const billsRepo = yield* FixedBillsRepository
    const rulesRepo = yield* RecurringRulesRepository

    const window = computeCycleWindow(input.anchorDay, new Date())
    const existing = yield* cyclesRepo.findByCycleKey(input.householdId, window.cycleKey)
    if (Option.isSome(existing)) {
      return yield* Effect.fail(new CycleAlreadyExists({}))
    }

    const cycle = yield* cyclesRepo.create({
      householdId: input.householdId,
      cycleKey: window.cycleKey,
      title: input.title,
      startDate: window.startDate,
      endDate: window.endDate,
      reserveMinor: input.reserveMinor,
      estimateMinor: input.estimateMinor,
      seedOpeningBalanceMinor: input.seedOpeningBalanceMinor,
    })

    const activeRules = yield* rulesRepo.listActiveFixedBillRules()
    yield* Effect.forEach(activeRules, (rule, index) =>
      billsRepo.create({
        cycleId: cycle.id,
        householdId: input.householdId,
        recurringRuleId: rule.id,
        label: rule.matcher,
        amountMinor: rule.expectedAmountMinor ?? 0,
        currency: rule.currency ?? input.baseCurrency,
        payingAccountId: null,
        dueDay: null,
        categoryId: rule.categoryId,
        sortOrder: index,
      }),
    )

    return cycle
  })

export interface EnsureCycleInput {
  readonly householdId: string
  readonly anchorDay: number
  readonly referenceDate: Date
}

// Backfills whichever cycle a transaction's booked date falls into, without scaffolding fixed
// bills from today's active recurring rules onto a historical cycle — unlike
// createCycleWithScaffold, this is meant for ingesting old statements (import a year of history,
// get a year of cycles), not for a user starting a fresh one from the app shell.
export const ensureCycleForDate = (input: EnsureCycleInput) =>
  Effect.gen(function* () {
    const cyclesRepo = yield* CyclesRepository
    const window = computeCycleWindow(input.anchorDay, input.referenceDate)
    const existing = yield* cyclesRepo.findByCycleKey(input.householdId, window.cycleKey)
    if (Option.isSome(existing)) {
      return existing.value
    }
    return yield* cyclesRepo.create({
      householdId: input.householdId,
      cycleKey: window.cycleKey,
      title: null,
      startDate: window.startDate,
      endDate: window.endDate,
      reserveMinor: 0,
      estimateMinor: null,
      seedOpeningBalanceMinor: null,
    })
  })
