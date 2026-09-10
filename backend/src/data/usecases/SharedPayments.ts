import { Effect, Option } from "effect"
import { AccountsRepository } from "../../data/protocols/AccountsRepository"
import { CyclesRepository } from "../../data/protocols/CyclesRepository"
import { FxRatesRepository } from "../../data/protocols/FxRatesRepository"
import { SharedPaymentsRepository } from "../../data/protocols/SharedPaymentsRepository"
import { AccountNotFound } from "../../domain/errors/AccountErrors"
import { CycleClosed } from "../../domain/errors/CycleErrors"
import { NoCycleForDate, SharedAccountRequired } from "../../domain/errors/PaymentErrors"
import { convertToBase } from "../../domain/services/FxConversion"

const convertAmount = (
  amountMinor: number,
  currency: string,
  baseCurrency: string,
  bookedAt: Date,
) =>
  Effect.gen(function* () {
    if (currency === baseCurrency) {
      return { amountBaseMinor: amountMinor, fxRate: null }
    }
    const fxRates = yield* FxRatesRepository
    const rate = yield* fxRates.findOnOrBefore(baseCurrency, currency, bookedAt)
    const converted = yield* convertToBase(
      { amountMinor, currency: currency as never },
      baseCurrency as never,
      Option.isSome(rate) ? { rate: rate.value.rate } : null,
    )
    return { amountBaseMinor: converted.amountBase.amountMinor, fxRate: converted.rate }
  })

export interface RecordPaymentInput {
  readonly householdId: string
  readonly baseCurrency: string
  readonly accountId: string
  readonly bookedAt: Date
  readonly description: string
  readonly counterparty: string | null
  readonly amountMinor: number
  readonly currency: string
  readonly categoryId: string
  readonly createdBy: string
}

export const recordPayment = (input: RecordPaymentInput) =>
  Effect.gen(function* () {
    const accounts = yield* AccountsRepository
    const cycles = yield* CyclesRepository
    const payments = yield* SharedPaymentsRepository

    const account = yield* accounts.findById(input.accountId)
    if (Option.isNone(account)) {
      return yield* Effect.fail(new AccountNotFound({}))
    }
    if (account.value.visibility !== "shared") {
      return yield* Effect.fail(new SharedAccountRequired({}))
    }

    const cycle = yield* cycles.findCurrent(input.bookedAt)
    if (Option.isNone(cycle)) {
      return yield* Effect.fail(new NoCycleForDate({}))
    }
    if (cycle.value.status === "closed") {
      return yield* Effect.fail(new CycleClosed({}))
    }

    const { amountBaseMinor, fxRate } = yield* convertAmount(
      input.amountMinor,
      input.currency,
      input.baseCurrency,
      input.bookedAt,
    )

    return yield* payments.create({
      householdId: input.householdId,
      cycleId: cycle.value.id,
      accountId: input.accountId,
      bookedAt: input.bookedAt,
      description: input.description,
      counterparty: input.counterparty,
      amountMinor: input.amountMinor,
      currency: input.currency,
      amountBaseMinor,
      fxRate,
      categoryId: input.categoryId,
      createdBy: input.createdBy,
    })
  })

export interface EditPaymentInput {
  readonly baseCurrency: string
  readonly description: string
  readonly counterparty: string | null
  readonly amountMinor: number
  readonly currency: string
  readonly bookedAt: Date
  readonly categoryId: string
}

export const editPayment = (id: string, input: EditPaymentInput) =>
  Effect.gen(function* () {
    const payments = yield* SharedPaymentsRepository

    const { amountBaseMinor, fxRate } = yield* convertAmount(
      input.amountMinor,
      input.currency,
      input.baseCurrency,
      input.bookedAt,
    )

    return yield* payments.update(id, {
      description: input.description,
      counterparty: input.counterparty,
      amountMinor: input.amountMinor,
      amountBaseMinor,
      fxRate,
      categoryId: input.categoryId,
    })
  })
