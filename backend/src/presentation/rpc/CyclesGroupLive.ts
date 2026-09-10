import { CurrentUser, CyclesRpcs } from "@nosko/contracts"
import { DateTime, Effect, Option } from "effect"
import { CategoryCapsRepository } from "../../data/protocols/CategoryCapsRepository"
import { CyclesRepository } from "../../data/protocols/CyclesRepository"
import { HouseholdsRepository } from "../../data/protocols/HouseholdsRepository"
import type { CycleWithFigures } from "../../data/usecases/Cycles"
import { createCycleWithScaffold, figuresForAllCycles } from "../../data/usecases/Cycles"
import { CycleClosed, CycleNotFound, MemberTransferNotFound } from "../../domain/errors/CycleErrors"
import { NoHousehold } from "../../domain/errors/HouseholdErrors"
import type { CategoryCap } from "../../domain/models/CategoryCap"
import type { Cycle, CycleIncome, MemberTransfer } from "../../domain/models/Cycle"
import { dieOnSqlError } from "./dieOnSqlError"

const toCycleView = (cycle: Cycle) => ({
  id: cycle.id,
  cycleKey: cycle.cycleKey,
  title: cycle.title,
  startDate: cycle.startDate,
  endDate: cycle.endDate,
  status: cycle.status,
  closedAt: cycle.closedAt,
  reserveMinor: cycle.reserveMinor,
  estimateMinor: cycle.estimateMinor,
  seedOpeningBalanceMinor: cycle.seedOpeningBalanceMinor,
  surplusGoalId: cycle.surplusGoalId,
  surplusDestinationLabel: cycle.surplusDestinationLabel,
})

const toIncomeView = (income: CycleIncome) => ({
  id: income.id,
  memberUserId: income.memberUserId,
  kind: income.kind,
  amountMinor: income.amountMinor,
  currency: income.currency,
})

const toTransferView = (transfer: MemberTransfer) => ({
  id: transfer.id,
  memberUserId: transfer.memberUserId,
  direction: transfer.direction,
  amountMinor: transfer.amountMinor,
  currency: transfer.currency,
  settledAt: transfer.settledAt,
  method: transfer.method,
})

const toCapView = (cap: CategoryCap) => ({ categoryId: cap.categoryId, capMinor: cap.capMinor })

const toSummaryView = ({ cycle, figures }: CycleWithFigures) => ({
  id: cycle.id,
  cycleKey: cycle.cycleKey,
  title: cycle.title,
  startDate: cycle.startDate,
  endDate: cycle.endDate,
  status: cycle.status,
  surplus: figures.surplus,
  savingsRate: figures.savingsRate,
})

const dieIfMissing = <A>(found: Option.Option<A>) =>
  Option.match(found, {
    onNone: () => Effect.die(new Error("expected row vanished mid-request")),
    onSome: Effect.succeed,
  })

export const CyclesGroupLive = CyclesRpcs.toLayer(
  Effect.gen(function* () {
    const cyclesRepo = yield* CyclesRepository
    const capsRepo = yield* CategoryCapsRepository
    const households = yield* HouseholdsRepository

    const requireHouseholdId = Effect.gen(function* () {
      const currentUser = yield* CurrentUser
      if (currentUser.householdId === null) {
        return yield* Effect.fail(new NoHousehold({}))
      }
      return currentUser.householdId
    })

    const requireCycle = (id: string) =>
      cyclesRepo.findById(id).pipe(
        dieOnSqlError,
        Effect.flatMap((found) =>
          Option.isNone(found) ? Effect.fail(new CycleNotFound({})) : Effect.succeed(found.value),
        ),
      )

    const requireOpen = (cycle: Cycle) =>
      cycle.status === "closed" ? Effect.fail(new CycleClosed({})) : Effect.succeed(cycle)

    const settingsFor = (householdId: string) =>
      households.findSettings(householdId).pipe(dieOnSqlError, Effect.flatMap(dieIfMissing))

    const detailFor = (entry: CycleWithFigures) =>
      Effect.gen(function* () {
        const incomes = yield* cyclesRepo.listIncomes(entry.cycle.id).pipe(dieOnSqlError)
        const transfers = yield* cyclesRepo.listTransfers(entry.cycle.id).pipe(dieOnSqlError)
        const caps = yield* capsRepo.listByCycle(entry.cycle.id).pipe(dieOnSqlError)
        return {
          cycle: toCycleView(entry.cycle),
          figures: entry.figures,
          incomes: incomes.map(toIncomeView),
          transfers: transfers.map(toTransferView),
          caps: caps.map(toCapView),
        }
      })

    return {
      "cycles.list": () =>
        Effect.gen(function* () {
          yield* requireHouseholdId
          const all = yield* figuresForAllCycles.pipe(dieOnSqlError)
          return all.map(toSummaryView)
        }),

      "cycles.get": (payload) =>
        Effect.gen(function* () {
          yield* requireHouseholdId
          const all = yield* figuresForAllCycles.pipe(dieOnSqlError)
          const found = all.find((entry) => entry.cycle.id === payload.id)
          if (found === undefined) {
            return yield* Effect.fail(new CycleNotFound({}))
          }
          return yield* detailFor(found)
        }),

      "cycles.getCurrent": () =>
        Effect.gen(function* () {
          yield* requireHouseholdId
          const all = yield* figuresForAllCycles.pipe(dieOnSqlError)
          const today = Date.now()
          const found = all.find(
            (entry) =>
              DateTime.toEpochMillis(entry.cycle.startDate) <= today &&
              DateTime.toEpochMillis(entry.cycle.endDate) >= today,
          )
          return found === undefined ? null : yield* detailFor(found)
        }),

      "cycles.create": (payload) =>
        Effect.gen(function* () {
          const householdId = yield* requireHouseholdId
          const settings = yield* settingsFor(householdId)
          const cycle = yield* createCycleWithScaffold({
            householdId,
            anchorDay: settings.cycleAnchorDay,
            baseCurrency: settings.baseCurrency,
            title: payload.title,
            reserveMinor: payload.reserveMinor ?? settings.defaultReserveMinor,
            estimateMinor: payload.estimateMinor,
            seedOpeningBalanceMinor: payload.seedOpeningBalanceMinor,
          }).pipe(dieOnSqlError)
          return toCycleView(cycle)
        }),

      "cycles.update": (payload) =>
        Effect.gen(function* () {
          const cycle = yield* requireCycle(payload.id)
          yield* requireOpen(cycle)
          const updated = yield* cyclesRepo
            .update(payload.id, {
              title: payload.title,
              reserveMinor: payload.reserveMinor,
              estimateMinor: payload.estimateMinor,
              surplusGoalId: payload.surplusGoalId,
              surplusDestinationLabel: payload.surplusDestinationLabel,
            })
            .pipe(dieOnSqlError)
          return toCycleView(updated)
        }),

      "cycles.close": (payload) =>
        Effect.gen(function* () {
          const cycle = yield* requireCycle(payload.id)
          yield* requireOpen(cycle)
          const closed = yield* cyclesRepo.close(payload.id).pipe(dieOnSqlError)
          return toCycleView(closed)
        }),

      "cycles.setIncome": (payload) =>
        Effect.gen(function* () {
          const cycle = yield* requireCycle(payload.cycleId)
          yield* requireOpen(cycle)
          const settings = yield* settingsFor(cycle.householdId)
          const income = yield* cyclesRepo
            .setIncome({
              cycleId: payload.cycleId,
              householdId: cycle.householdId,
              memberUserId: payload.memberUserId,
              kind: payload.kind,
              amountMinor: payload.amountMinor,
              currency: settings.baseCurrency,
            })
            .pipe(dieOnSqlError)
          return toIncomeView(income)
        }),

      "cycles.recordTransfer": (payload) =>
        Effect.gen(function* () {
          const cycle = yield* requireCycle(payload.cycleId)
          yield* requireOpen(cycle)
          const settings = yield* settingsFor(cycle.householdId)
          const transfer = yield* cyclesRepo
            .recordTransfer({
              cycleId: payload.cycleId,
              householdId: cycle.householdId,
              memberUserId: payload.memberUserId,
              direction: payload.direction,
              amountMinor: payload.amountMinor,
              currency: settings.baseCurrency,
              method: payload.method,
            })
            .pipe(dieOnSqlError)
          return toTransferView(transfer)
        }),

      "cycles.settleTransfer": (payload) =>
        Effect.gen(function* () {
          const found = yield* cyclesRepo.findTransferById(payload.transferId).pipe(dieOnSqlError)
          if (Option.isNone(found)) {
            return yield* Effect.fail(new MemberTransferNotFound({}))
          }
          const settled = yield* cyclesRepo.settleTransfer(payload.transferId).pipe(dieOnSqlError)
          return toTransferView(settled)
        }),

      "cycles.setCategoryCaps": (payload) =>
        Effect.gen(function* () {
          const cycle = yield* requireCycle(payload.cycleId)
          const caps = yield* capsRepo
            .replaceForCycle(cycle.householdId, payload.cycleId, payload.caps)
            .pipe(dieOnSqlError)
          return caps.map(toCapView)
        }),

      "cycles.trends": () =>
        Effect.gen(function* () {
          yield* requireHouseholdId
          const all = yield* figuresForAllCycles.pipe(dieOnSqlError)
          const closed = all.filter((entry) => entry.cycle.status === "closed")
          const thisYear = new Date().getUTCFullYear()
          const yearlyTotalSavedMinor = closed
            .filter(
              (entry) => DateTime.toEpochMillis(entry.cycle.startDate) >= Date.UTC(thisYear, 0, 1),
            )
            .reduce((sum, entry) => sum + entry.figures.surplus, 0)
          const averageSavingsRate =
            closed.length === 0
              ? 0
              : closed.reduce((sum, entry) => sum + entry.figures.savingsRate, 0) / closed.length

          return {
            cycles: closed.map((entry) => ({
              cycleId: entry.cycle.id,
              cycleKey: entry.cycle.cycleKey,
              surplus: entry.figures.surplus,
              savingsRate: entry.figures.savingsRate,
            })),
            averageSavingsRate,
            yearlyTotalSavedMinor,
          }
        }),

      "cycles.compare": (payload) =>
        Effect.gen(function* () {
          yield* requireHouseholdId
          const all = yield* figuresForAllCycles.pipe(dieOnSqlError)
          const a = all.find((entry) => entry.cycle.id === payload.cycleIdA)
          const b = all.find((entry) => entry.cycle.id === payload.cycleIdB)
          if (a === undefined || b === undefined) {
            return yield* Effect.fail(new CycleNotFound({}))
          }
          return { a: yield* detailFor(a), b: yield* detailFor(b) }
        }),
    }
  }),
)
