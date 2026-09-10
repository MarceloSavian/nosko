import { describe, expect, it } from "@jest/globals"
import { DateTime, Effect, Exit, Layer } from "effect"
import type { Account } from "../../domain/models/Account"
import type { Cycle } from "../../domain/models/Cycle"
import {
  makeFakeAccountsRepository,
  makeFakeCyclesRepository,
  makeFakeFxRatesRepository,
  makeFakeSharedPaymentsRepository,
} from "../../test/fakeRepositories"
import { editPayment, recordPayment } from "./SharedPayments"

const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const userId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"

const sharedAccount: Account = {
  id: "11111111-1111-1111-1111-111111111111",
  householdId,
  ownerUserId: userId,
  coOwnerUserId: null,
  ownership: "joint",
  visibility: "shared",
  institution: "ing",
  nickname: "ING Conjunta",
  type: "checking",
  currency: "EUR",
  maskedId: null,
  balanceMinor: 500_000,
  purpose: null,
  statementCloseDay: null,
  creditLimitMinor: null,
  autopayAccountId: null,
  source: "manual",
  lastImportAt: null,
  createdAt: DateTime.unsafeFromDate(new Date()),
  updatedAt: DateTime.unsafeFromDate(new Date()),
}

const personalAccount: Account = {
  ...sharedAccount,
  id: "22222222-2222-2222-2222-222222222222",
  visibility: "personal",
  ownership: "sole",
}

const openCycle: Cycle = {
  id: "33333333-3333-3333-3333-333333333333",
  householdId,
  cycleKey: "2026-01",
  title: null,
  startDate: DateTime.unsafeFromDate(new Date("2026-01-01T00:00:00.000Z")),
  endDate: DateTime.unsafeFromDate(new Date("2026-01-31T00:00:00.000Z")),
  status: "open",
  closedAt: null,
  reserveMinor: 0,
  estimateMinor: null,
  seedOpeningBalanceMinor: null,
  surplusGoalId: null,
  surplusDestinationLabel: null,
  createdAt: DateTime.unsafeFromDate(new Date()),
  updatedAt: DateTime.unsafeFromDate(new Date()),
}

const basePaymentInput = {
  householdId,
  baseCurrency: "EUR",
  accountId: sharedAccount.id,
  bookedAt: new Date("2026-01-10T00:00:00.000Z"),
  description: "Mercado",
  counterparty: null,
  amountMinor: 10_000,
  currency: "EUR",
  categoryId: "44444444-4444-4444-4444-444444444444",
  createdBy: userId,
}

describe("recordPayment", () => {
  it("records a same-currency payment with no fx rate", async () => {
    const accountsFake = makeFakeAccountsRepository([sharedAccount])
    const cyclesFake = makeFakeCyclesRepository([openCycle])
    const fxFake = makeFakeFxRatesRepository()
    const paymentsFake = makeFakeSharedPaymentsRepository()
    const layer = Layer.mergeAll(
      accountsFake.layer,
      cyclesFake.layer,
      fxFake.layer,
      paymentsFake.layer,
    )

    const result = await Effect.runPromise(
      recordPayment(basePaymentInput).pipe(Effect.provide(layer)),
    )

    expect(result.amountBaseMinor).toBe(10_000)
    expect(result.fxRate).toBeNull()
    expect(result.cycleId).toBe(openCycle.id)
  })

  it("converts a non-base-currency payment using the fx rate on or before the booked date", async () => {
    const accountsFake = makeFakeAccountsRepository([sharedAccount])
    const cyclesFake = makeFakeCyclesRepository([openCycle])
    const fxFake = makeFakeFxRatesRepository([
      {
        id: "rate-1",
        rateDate: DateTime.unsafeFromDate(new Date("2026-01-05T00:00:00.000Z")),
        base: "EUR",
        quote: "BRL",
        rate: 5,
        createdAt: DateTime.unsafeFromDate(new Date()),
      },
    ])
    const paymentsFake = makeFakeSharedPaymentsRepository()
    const layer = Layer.mergeAll(
      accountsFake.layer,
      cyclesFake.layer,
      fxFake.layer,
      paymentsFake.layer,
    )

    const result = await Effect.runPromise(
      recordPayment({ ...basePaymentInput, currency: "BRL", amountMinor: 50_000 }).pipe(
        Effect.provide(layer),
      ),
    )

    expect(result.amountBaseMinor).toBe(10_000)
    expect(result.fxRate).toBe(5)
  })

  it("fails with NoFxRate when no rate exists for a non-base currency", async () => {
    const accountsFake = makeFakeAccountsRepository([sharedAccount])
    const cyclesFake = makeFakeCyclesRepository([openCycle])
    const fxFake = makeFakeFxRatesRepository()
    const paymentsFake = makeFakeSharedPaymentsRepository()
    const layer = Layer.mergeAll(
      accountsFake.layer,
      cyclesFake.layer,
      fxFake.layer,
      paymentsFake.layer,
    )

    const exit = await Effect.runPromiseExit(
      recordPayment({ ...basePaymentInput, currency: "BRL" }).pipe(Effect.provide(layer)),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("fails with AccountNotFound for an unknown account", async () => {
    const accountsFake = makeFakeAccountsRepository([])
    const cyclesFake = makeFakeCyclesRepository([openCycle])
    const fxFake = makeFakeFxRatesRepository()
    const paymentsFake = makeFakeSharedPaymentsRepository()
    const layer = Layer.mergeAll(
      accountsFake.layer,
      cyclesFake.layer,
      fxFake.layer,
      paymentsFake.layer,
    )

    const exit = await Effect.runPromiseExit(
      recordPayment(basePaymentInput).pipe(Effect.provide(layer)),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("fails with SharedAccountRequired for a personal account", async () => {
    const accountsFake = makeFakeAccountsRepository([personalAccount])
    const cyclesFake = makeFakeCyclesRepository([openCycle])
    const fxFake = makeFakeFxRatesRepository()
    const paymentsFake = makeFakeSharedPaymentsRepository()
    const layer = Layer.mergeAll(
      accountsFake.layer,
      cyclesFake.layer,
      fxFake.layer,
      paymentsFake.layer,
    )

    const exit = await Effect.runPromiseExit(
      recordPayment({ ...basePaymentInput, accountId: personalAccount.id }).pipe(
        Effect.provide(layer),
      ),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("fails with NoCycleForDate when no cycle covers the booked date", async () => {
    const accountsFake = makeFakeAccountsRepository([sharedAccount])
    const cyclesFake = makeFakeCyclesRepository([])
    const fxFake = makeFakeFxRatesRepository()
    const paymentsFake = makeFakeSharedPaymentsRepository()
    const layer = Layer.mergeAll(
      accountsFake.layer,
      cyclesFake.layer,
      fxFake.layer,
      paymentsFake.layer,
    )

    const exit = await Effect.runPromiseExit(
      recordPayment(basePaymentInput).pipe(Effect.provide(layer)),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("fails with CycleClosed for a closed cycle", async () => {
    const accountsFake = makeFakeAccountsRepository([sharedAccount])
    const cyclesFake = makeFakeCyclesRepository([{ ...openCycle, status: "closed" }])
    const fxFake = makeFakeFxRatesRepository()
    const paymentsFake = makeFakeSharedPaymentsRepository()
    const layer = Layer.mergeAll(
      accountsFake.layer,
      cyclesFake.layer,
      fxFake.layer,
      paymentsFake.layer,
    )

    const exit = await Effect.runPromiseExit(
      recordPayment(basePaymentInput).pipe(Effect.provide(layer)),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })
})

describe("editPayment", () => {
  it("re-converts the amount on edit", async () => {
    const fxFake = makeFakeFxRatesRepository([
      {
        id: "rate-1",
        rateDate: DateTime.unsafeFromDate(new Date("2026-01-05T00:00:00.000Z")),
        base: "EUR",
        quote: "BRL",
        rate: 5,
        createdAt: DateTime.unsafeFromDate(new Date()),
      },
    ])
    const paymentsFake = makeFakeSharedPaymentsRepository([
      {
        id: "55555555-5555-5555-5555-555555555555",
        householdId,
        cycleId: openCycle.id,
        accountId: sharedAccount.id,
        bookedAt: DateTime.unsafeFromDate(new Date("2026-01-10T00:00:00.000Z")),
        description: "Mercado",
        counterparty: null,
        amountMinor: 10_000,
        currency: "EUR",
        amountBaseMinor: 10_000,
        fxRate: null,
        categoryId: "44444444-4444-4444-4444-444444444444",
        createdBy: userId,
        createdAt: DateTime.unsafeFromDate(new Date()),
        updatedAt: DateTime.unsafeFromDate(new Date()),
      },
    ])
    const layer = Layer.mergeAll(fxFake.layer, paymentsFake.layer)

    const result = await Effect.runPromise(
      editPayment("55555555-5555-5555-5555-555555555555", {
        baseCurrency: "EUR",
        description: "Feira",
        counterparty: null,
        amountMinor: 100_000,
        currency: "BRL",
        bookedAt: new Date("2026-01-10T00:00:00.000Z"),
        categoryId: "44444444-4444-4444-4444-444444444444",
      }).pipe(Effect.provide(layer)),
    )

    expect(result.description).toBe("Feira")
    expect(result.amountBaseMinor).toBe(20_000)
    expect(result.fxRate).toBe(5)
  })
})
