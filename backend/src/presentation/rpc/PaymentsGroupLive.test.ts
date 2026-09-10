import * as RpcTest from "@effect/rpc/RpcTest"
import { describe, expect, it } from "@jest/globals"
import { PaymentsRpcs } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Exit, Layer, type Scope } from "effect"
import type { Account } from "../../domain/models/Account"
import type { Cycle } from "../../domain/models/Cycle"
import type { SharedPayment } from "../../domain/models/SharedPayment"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import {
  makeFakeAccountsRepository,
  makeFakeCategoryCapsRepository,
  makeFakeCyclesRepository,
  makeFakeFixedBillsRepository,
  makeFakeFxRatesRepository,
  makeFakeHouseholdsRepository,
  makeFakeSharedPaymentsRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthMiddlewareLive } from "./AuthMiddlewareLive"
import { PaymentsGroupLive } from "./PaymentsGroupLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const marceloId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const gabrieleId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"
const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae9"
const cycleId = "11111111-1111-1111-1111-111111111111"
const closedCycleId = "22222222-2222-2222-2222-222222222222"
const accountId = "33333333-3333-3333-3333-333333333333"
const personalAccountId = "44444444-4444-4444-4444-444444444444"
const categoryId = "55555555-5555-5555-5555-555555555555"

const utc = (iso: string) => DateTime.unsafeFromDate(new Date(iso))

const buildTestLayer = () => {
  const { layer: sqlLayer } = makeTestSqlClient(() => [])
  const paymentsFake = makeFakeSharedPaymentsRepository()
  const cyclesFake = makeFakeCyclesRepository()
  const billsFake = makeFakeFixedBillsRepository()
  const capsFake = makeFakeCategoryCapsRepository()
  const accountsFake = makeFakeAccountsRepository()
  const fxFake = makeFakeFxRatesRepository()
  const householdsFake = makeFakeHouseholdsRepository({
    households: [
      {
        id: householdId,
        name: "Casa",
        baseCurrency: "EUR",
        createdBy: marceloId,
        createdAt: utc("2025-01-01T00:00:00.000Z"),
        updatedAt: utc("2025-01-01T00:00:00.000Z"),
      },
    ],
    members: [
      {
        householdId,
        userId: marceloId,
        role: "owner",
        displayName: null,
        joinedAt: utc("2025-01-01T00:00:00.000Z"),
      },
    ],
  })

  const openCycle: Cycle = {
    id: cycleId,
    householdId,
    cycleKey: "2026-01",
    title: null,
    startDate: utc("2026-01-01T00:00:00.000Z"),
    endDate: utc("2026-01-31T00:00:00.000Z"),
    status: "open",
    closedAt: null,
    reserveMinor: 0,
    estimateMinor: 50_000,
    seedOpeningBalanceMinor: null,
    surplusGoalId: null,
    surplusDestinationLabel: null,
    createdAt: utc("2026-01-01T00:00:00.000Z"),
    updatedAt: utc("2026-01-01T00:00:00.000Z"),
  }
  cyclesFake.cycles.set(cycleId, openCycle)
  cyclesFake.cycles.set(closedCycleId, { ...openCycle, id: closedCycleId, status: "closed" })

  const sharedAccount: Account = {
    id: accountId,
    householdId,
    ownerUserId: marceloId,
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
    createdAt: utc("2025-01-01T00:00:00.000Z"),
    updatedAt: utc("2025-01-01T00:00:00.000Z"),
  }
  accountsFake.accounts.set(accountId, sharedAccount)
  accountsFake.accounts.set(personalAccountId, {
    ...sharedAccount,
    id: personalAccountId,
    ownership: "sole",
    visibility: "personal",
  })

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    paymentsFake.layer,
    cyclesFake.layer,
    billsFake.layer,
    capsFake.layer,
    accountsFake.layer,
    fxFake.layer,
    householdsFake.layer,
    AccessTokensLive,
  )

  const testLayer = Layer.mergeAll(PaymentsGroupLive, AuthMiddlewareLive).pipe(
    Layer.provide(infraLayer),
  )

  return {
    testLayer,
    payments: paymentsFake.payments,
    rates: fxFake.rates,
    caps: capsFake.caps,
  }
}

const signAccessToken = (userId: string) =>
  Effect.gen(function* () {
    const accessTokens = yield* AccessTokens
    return yield* accessTokens.sign({ userId, sessionId: "session-1" })
  }).pipe(
    Effect.provide(AccessTokensLive),
    Effect.withConfigProvider(withConfig),
    Effect.runPromise,
  )

const headersFor = (token: string) => ({ headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } })

const run = <A, E, R>(
  testLayer: Layer.Layer<R, unknown, never>,
  effect: Effect.Effect<A, E, R | Scope.Scope>,
) =>
  Effect.runPromiseExit(
    Effect.scoped(effect).pipe(Effect.provide(testLayer), Effect.withConfigProvider(withConfig)),
  )

const newPaymentPayload = (overrides: Partial<{ accountId: string; currency: string }> = {}) => ({
  accountId,
  bookedAt: DateTime.unsafeFromDate(new Date("2026-01-10T00:00:00.000Z")),
  description: "Mercado",
  counterparty: null,
  amountMinor: 10_000,
  currency: "EUR",
  categoryId,
  ...overrides,
})

describe("PaymentsGroupLive", () => {
  it("payments.create records a payment in the resolved cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        return yield* client("payments.create", newPaymentPayload(), headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.cycleId).toBe(cycleId)
      expect(exit.value.amountBaseMinor).toBe(10_000)
    }
  })

  it("payments.create fails with SharedAccountRequired for a personal account", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        return yield* client(
          "payments.create",
          newPaymentPayload({ accountId: personalAccountId }),
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("payments.create fails with NoFxRate when converting a currency with no stored rate", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        return yield* client(
          "payments.create",
          newPaymentPayload({ currency: "BRL" }),
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("payments.create fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(gabrieleId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        return yield* client("payments.create", newPaymentPayload(), headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("payments.list lists payments for a cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        yield* client("payments.create", newPaymentPayload(), headersFor(token))
        return yield* client("payments.list", { cycleId }, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toHaveLength(1)
    }
  })

  it("payments.list fails with CycleNotFound for an unknown cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        return yield* client(
          "payments.list",
          { cycleId: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("payments.update re-converts the amount and keeps the original booked date", async () => {
    const { testLayer, rates } = buildTestLayer()
    rates.push({
      id: "rate-1",
      rateDate: utc("2026-01-05T00:00:00.000Z"),
      base: "EUR",
      quote: "BRL",
      rate: 5,
      createdAt: utc("2026-01-05T00:00:00.000Z"),
    })
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        const created = yield* client("payments.create", newPaymentPayload(), headersFor(token))
        return yield* client(
          "payments.update",
          {
            id: created.id,
            description: "Feira",
            counterparty: null,
            amountMinor: 50_000,
            currency: "BRL",
            categoryId,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.description).toBe("Feira")
      expect(exit.value.amountBaseMinor).toBe(10_000)
    }
  })

  it("payments.update fails with SharedPaymentNotFound for an unknown payment", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        return yield* client(
          "payments.update",
          {
            id: "00000000-0000-0000-0000-000000000000",
            description: "Nope",
            counterparty: null,
            amountMinor: 0,
            currency: "EUR",
            categoryId,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("payments.update fails with CycleClosed when the payment's cycle is closed", async () => {
    const { testLayer, payments } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        const created = yield* client("payments.create", newPaymentPayload(), headersFor(token))
        const existing = payments.get(created.id) as SharedPayment
        payments.set(created.id, { ...existing, cycleId: closedCycleId })
        return yield* client(
          "payments.update",
          {
            id: created.id,
            description: "Nope",
            counterparty: null,
            amountMinor: 0,
            currency: "EUR",
            categoryId,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("dies if the payment's cycle row is gone by the time the handler runs", async () => {
    const { testLayer, payments } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        const created = yield* client("payments.create", newPaymentPayload(), headersFor(token))
        const existing = payments.get(created.id) as SharedPayment
        payments.set(created.id, {
          ...existing,
          cycleId: "00000000-0000-0000-0000-000000000000",
        })
        return yield* client("payments.remove", { id: created.id }, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause._tag).toBe("Die")
    }
  })

  it("payments.remove removes a payment on an open cycle", async () => {
    const { testLayer, payments } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        const created = yield* client("payments.create", newPaymentPayload(), headersFor(token))
        yield* client("payments.remove", { id: created.id }, headersFor(token))
        return created.id
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(payments.size).toBe(0)
  })

  it("payments.remove fails with SharedPaymentNotFound for an unknown payment", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        return yield* client(
          "payments.remove",
          { id: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("payments.remove fails with CycleClosed when the payment's cycle is closed", async () => {
    const { testLayer, payments } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        const created = yield* client("payments.create", newPaymentPayload(), headersFor(token))
        const existing = payments.get(created.id) as SharedPayment
        payments.set(created.id, { ...existing, cycleId: closedCycleId })
        return yield* client("payments.remove", { id: created.id }, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("payments.summary totals spend per category against caps and the chained estimate", async () => {
    const { testLayer, caps } = buildTestLayer()
    caps.set("cap-1", { id: "cap-1", householdId, cycleId, categoryId, capMinor: 40_000 })
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        yield* client("payments.create", newPaymentPayload(), headersFor(token))
        return yield* client("payments.summary", { cycleId }, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.cycleTotalMinor).toBe(10_000)
      expect(exit.value.estimateMinor).toBe(50_000)
      expect(exit.value.byCategory).toEqual(
        expect.arrayContaining([expect.objectContaining({ categoryId, spentMinor: 10_000 })]),
      )
    }
  })

  it("payments.summary fails with CycleNotFound for an unknown cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(PaymentsRpcs, { flatten: true })
        return yield* client(
          "payments.summary",
          { cycleId: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })
})
