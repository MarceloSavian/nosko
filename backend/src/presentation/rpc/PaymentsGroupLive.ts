import { CurrentUser, PaymentsRpcs } from "@nosko/contracts"
import { DateTime, Effect, Option } from "effect"
import { CategoryCapsRepository } from "../../data/protocols/CategoryCapsRepository"
import { CyclesRepository } from "../../data/protocols/CyclesRepository"
import { HouseholdsRepository } from "../../data/protocols/HouseholdsRepository"
import { SharedPaymentsRepository } from "../../data/protocols/SharedPaymentsRepository"
import { figuresForAllCycles } from "../../data/usecases/Cycles"
import { editPayment, recordPayment } from "../../data/usecases/SharedPayments"
import { CycleClosed, CycleNotFound } from "../../domain/errors/CycleErrors"
import { NoHousehold } from "../../domain/errors/HouseholdErrors"
import { SharedPaymentNotFound } from "../../domain/errors/PaymentErrors"
import type { Cycle } from "../../domain/models/Cycle"
import type { SharedPayment } from "../../domain/models/SharedPayment"
import { computeByCategory } from "../../domain/services/CycleEngine"
import { dieOnSqlError } from "./dieOnSqlError"

const DAY_MS = 24 * 60 * 60 * 1000

const toPaymentView = (payment: SharedPayment) => ({
  id: payment.id,
  cycleId: payment.cycleId,
  accountId: payment.accountId,
  bookedAt: payment.bookedAt,
  description: payment.description,
  counterparty: payment.counterparty,
  amountMinor: payment.amountMinor,
  currency: payment.currency,
  amountBaseMinor: payment.amountBaseMinor,
  fxRate: payment.fxRate,
  categoryId: payment.categoryId,
})

const dieIfMissing = <A>(found: Option.Option<A>) =>
  Option.match(found, {
    onNone: () => Effect.die(new Error("expected row vanished mid-request")),
    onSome: Effect.succeed,
  })

export const PaymentsGroupLive = PaymentsRpcs.toLayer(
  Effect.gen(function* () {
    const paymentsRepo = yield* SharedPaymentsRepository
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

    const requirePayment = (id: string) =>
      paymentsRepo.findById(id).pipe(
        dieOnSqlError,
        Effect.flatMap((found) =>
          Option.isNone(found)
            ? Effect.fail(new SharedPaymentNotFound({}))
            : Effect.succeed(found.value),
        ),
      )

    const requireOpenCycleForPayment = (payment: SharedPayment) =>
      cyclesRepo.findById(payment.cycleId).pipe(
        dieOnSqlError,
        Effect.flatMap(dieIfMissing),
        Effect.flatMap((cycle: Cycle) =>
          cycle.status === "closed" ? Effect.fail(new CycleClosed({})) : Effect.succeed(cycle),
        ),
      )

    const baseCurrencyFor = (householdId: string) =>
      households.findSettings(householdId).pipe(
        dieOnSqlError,
        Effect.flatMap(dieIfMissing),
        Effect.map((settings) => settings.baseCurrency),
      )

    return {
      "payments.list": (payload) =>
        Effect.gen(function* () {
          yield* requireHouseholdId
          yield* requireCycle(payload.cycleId)
          const payments = yield* paymentsRepo.listByCycle(payload.cycleId).pipe(dieOnSqlError)
          return payments.map(toPaymentView)
        }),

      "payments.create": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const householdId = yield* requireHouseholdId
          const baseCurrency = yield* baseCurrencyFor(householdId)
          const created = yield* recordPayment({
            householdId,
            baseCurrency,
            accountId: payload.accountId,
            bookedAt: DateTime.toDate(payload.bookedAt),
            description: payload.description,
            counterparty: payload.counterparty,
            amountMinor: payload.amountMinor,
            currency: payload.currency,
            categoryId: payload.categoryId,
            createdBy: currentUser.userId,
          }).pipe(dieOnSqlError)
          return toPaymentView(created)
        }),

      "payments.update": (payload) =>
        Effect.gen(function* () {
          const existing = yield* requirePayment(payload.id)
          yield* requireOpenCycleForPayment(existing)
          const baseCurrency = yield* baseCurrencyFor(existing.householdId)
          const updated = yield* editPayment(payload.id, {
            baseCurrency,
            description: payload.description,
            counterparty: payload.counterparty,
            amountMinor: payload.amountMinor,
            currency: payload.currency,
            bookedAt: DateTime.toDate(existing.bookedAt),
            categoryId: payload.categoryId,
          }).pipe(dieOnSqlError)
          return toPaymentView(updated)
        }),

      "payments.remove": (payload) =>
        Effect.gen(function* () {
          const existing = yield* requirePayment(payload.id)
          yield* requireOpenCycleForPayment(existing)
          yield* paymentsRepo.remove(payload.id).pipe(dieOnSqlError)
        }),

      "payments.summary": (payload) =>
        Effect.gen(function* () {
          yield* requireHouseholdId
          const all = yield* figuresForAllCycles.pipe(dieOnSqlError)
          const entry = all.find((e) => e.cycle.id === payload.cycleId)
          if (entry === undefined) {
            return yield* Effect.fail(new CycleNotFound({}))
          }

          const payments = yield* paymentsRepo.listByCycle(payload.cycleId).pipe(dieOnSqlError)
          const caps = yield* capsRepo.listByCycle(payload.cycleId).pipe(dieOnSqlError)
          const cycleTotalMinor = payments.reduce((sum, p) => sum + p.amountBaseMinor, 0)
          const daysElapsed = Math.max(
            Math.round((Date.now() - DateTime.toEpochMillis(entry.cycle.startDate)) / DAY_MS) + 1,
            1,
          )

          return {
            cycleTotalMinor,
            estimateMinor: entry.figures.estimate,
            averagePerDayMinor: Math.round(cycleTotalMinor / daysElapsed),
            byCategory: computeByCategory(payments, caps),
          }
        }),
    }
  }),
)
