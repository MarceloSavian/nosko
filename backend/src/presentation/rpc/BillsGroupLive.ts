import { BillsRpcs, CurrentUser } from "@nosko/contracts"
import { Effect, Option } from "effect"
import { CyclesRepository } from "../../data/protocols/CyclesRepository"
import { FixedBillsRepository } from "../../data/protocols/FixedBillsRepository"
import { HouseholdsRepository } from "../../data/protocols/HouseholdsRepository"
import { FixedBillNotFound } from "../../domain/errors/BillErrors"
import { CycleClosed, CycleNotFound } from "../../domain/errors/CycleErrors"
import { NoHousehold } from "../../domain/errors/HouseholdErrors"
import type { Cycle } from "../../domain/models/Cycle"
import type { FixedBill } from "../../domain/models/FixedBill"
import { dieOnSqlError } from "./dieOnSqlError"

const toBillView = (bill: FixedBill) => ({
  id: bill.id,
  cycleId: bill.cycleId,
  recurringRuleId: bill.recurringRuleId,
  label: bill.label,
  amountMinor: bill.amountMinor,
  currency: bill.currency,
  paid: bill.paid,
  paidOnDay: bill.paidOnDay,
  payingAccountId: bill.payingAccountId,
  dueDay: bill.dueDay,
  autoPaid: bill.autoPaid,
  categoryId: bill.categoryId,
  sortOrder: bill.sortOrder,
})

const dieIfMissing = <A>(found: Option.Option<A>) =>
  Option.match(found, {
    onNone: () => Effect.die(new Error("expected row vanished mid-request")),
    onSome: Effect.succeed,
  })

export const BillsGroupLive = BillsRpcs.toLayer(
  Effect.gen(function* () {
    const billsRepo = yield* FixedBillsRepository
    const cyclesRepo = yield* CyclesRepository
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

    const requireOpenCycle = (cycle: Cycle) =>
      cycle.status === "closed" ? Effect.fail(new CycleClosed({})) : Effect.succeed(cycle)

    const requireBill = (id: string) =>
      billsRepo.findById(id).pipe(
        dieOnSqlError,
        Effect.flatMap((found) =>
          Option.isNone(found)
            ? Effect.fail(new FixedBillNotFound({}))
            : Effect.succeed(found.value),
        ),
      )

    const requireOpenCycleForBill = (bill: FixedBill) =>
      cyclesRepo.findById(bill.cycleId).pipe(
        dieOnSqlError,
        Effect.flatMap(dieIfMissing),
        Effect.flatMap((cycle) =>
          cycle.status === "closed" ? Effect.fail(new CycleClosed({})) : Effect.succeed(cycle),
        ),
      )

    return {
      "bills.list": (payload) =>
        Effect.gen(function* () {
          yield* requireHouseholdId
          yield* requireCycle(payload.cycleId)
          const bills = yield* billsRepo.listByCycle(payload.cycleId).pipe(dieOnSqlError)
          return bills.map(toBillView)
        }),

      "bills.create": (payload) =>
        Effect.gen(function* () {
          const householdId = yield* requireHouseholdId
          const cycle = yield* requireCycle(payload.cycleId)
          yield* requireOpenCycle(cycle)
          const settings = yield* households
            .findSettings(householdId)
            .pipe(dieOnSqlError, Effect.flatMap(dieIfMissing))
          const created = yield* billsRepo
            .create({
              cycleId: payload.cycleId,
              householdId,
              recurringRuleId: payload.recurringRuleId,
              label: payload.label,
              amountMinor: payload.amountMinor,
              currency: settings.baseCurrency,
              payingAccountId: payload.payingAccountId,
              dueDay: payload.dueDay,
              categoryId: payload.categoryId,
              sortOrder: payload.sortOrder,
            })
            .pipe(dieOnSqlError)
          return toBillView(created)
        }),

      "bills.update": (payload) =>
        Effect.gen(function* () {
          const bill = yield* requireBill(payload.id)
          yield* requireOpenCycleForBill(bill)
          const updated = yield* billsRepo
            .update(payload.id, {
              label: payload.label,
              amountMinor: payload.amountMinor,
              payingAccountId: payload.payingAccountId,
              dueDay: payload.dueDay,
              categoryId: payload.categoryId,
              sortOrder: payload.sortOrder,
            })
            .pipe(dieOnSqlError)
          return toBillView(updated)
        }),

      "bills.setPaid": (payload) =>
        Effect.gen(function* () {
          yield* requireBill(payload.id)
          const updated = yield* billsRepo
            .setPaid(payload.id, payload.paid, payload.paidOnDay)
            .pipe(dieOnSqlError)
          return toBillView(updated)
        }),

      "bills.remove": (payload) =>
        Effect.gen(function* () {
          const bill = yield* requireBill(payload.id)
          yield* requireOpenCycleForBill(bill)
          yield* billsRepo.remove(payload.id).pipe(dieOnSqlError)
        }),
    }
  }),
)
