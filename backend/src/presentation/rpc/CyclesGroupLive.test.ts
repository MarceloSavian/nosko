import * as RpcTest from "@effect/rpc/RpcTest"
import { describe, expect, it } from "@jest/globals"
import { CyclesRpcs } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Exit, Layer, type Scope } from "effect"
import type { Cycle } from "../../domain/models/Cycle"
import type { RecurringRule } from "../../domain/models/RecurringRule"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import {
  makeFakeCategoryCapsRepository,
  makeFakeCyclesRepository,
  makeFakeFixedBillsRepository,
  makeFakeHouseholdsRepository,
  makeFakeRecurringRulesRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthMiddlewareLive } from "./AuthMiddlewareLive"
import { CyclesGroupLive } from "./CyclesGroupLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const marceloId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const gabrieleId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"
const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae9"

const utc = (iso: string) => DateTime.unsafeFromDate(new Date(iso))

const buildTestLayer = () => {
  const { layer: sqlLayer } = makeTestSqlClient(() => [])
  const cyclesFake = makeFakeCyclesRepository()
  const billsFake = makeFakeFixedBillsRepository()
  const rulesFake = makeFakeRecurringRulesRepository()
  const capsFake = makeFakeCategoryCapsRepository()
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

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    cyclesFake.layer,
    billsFake.layer,
    rulesFake.layer,
    capsFake.layer,
    householdsFake.layer,
    AccessTokensLive,
  )

  const testLayer = Layer.mergeAll(CyclesGroupLive, AuthMiddlewareLive).pipe(
    Layer.provide(infraLayer),
  )

  return {
    testLayer,
    cycles: cyclesFake.cycles,
    incomes: cyclesFake.incomes,
    transfers: cyclesFake.transfers,
    bills: billsFake.bills,
    rules: rulesFake.rules,
    caps: capsFake.caps,
    settings: householdsFake.settings,
  }
}

const makeCycle = (overrides: Partial<Cycle> & { id: string }): Cycle => ({
  householdId,
  cycleKey: overrides.id,
  title: null,
  startDate: utc("2026-01-01T00:00:00.000Z"),
  endDate: utc("2026-01-31T00:00:00.000Z"),
  status: "open",
  closedAt: null,
  reserveMinor: 0,
  estimateMinor: null,
  seedOpeningBalanceMinor: null,
  surplusGoalId: null,
  surplusDestinationLabel: null,
  createdAt: utc("2026-01-01T00:00:00.000Z"),
  updatedAt: utc("2026-01-01T00:00:00.000Z"),
  ...overrides,
})

const makeRule = (overrides: Partial<RecurringRule> & { id: string }): RecurringRule => ({
  householdId,
  matchType: "vendor_exact",
  matcher: "Aluguel",
  expectedAmountMinor: 150_000,
  currency: "EUR",
  categoryId: null,
  cadence: "monthly",
  isFixedBill: true,
  active: true,
  source: "user_defined",
  confidence: null,
  createdAt: utc("2026-01-01T00:00:00.000Z"),
  updatedAt: utc("2026-01-01T00:00:00.000Z"),
  ...overrides,
})

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

describe("CyclesGroupLive", () => {
  it("cycles.create scaffolds fixed bills from active rules and applies household defaults", async () => {
    const { testLayer, rules, bills, settings } = buildTestLayer()
    const s = settings.get(householdId)
    if (s) settings.set(householdId, { ...s, defaultReserveMinor: 25_000 })
    rules.set(
      "44444444-4444-4444-4444-444444444444",
      makeRule({ id: "44444444-4444-4444-4444-444444444444" }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.create",
          {
            title: "Janeiro",
            reserveMinor: null,
            estimateMinor: null,
            seedOpeningBalanceMinor: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.title).toBe("Janeiro")
      expect(exit.value.reserveMinor).toBe(25_000)
    }
    expect(bills.size).toBe(1)
    expect([...bills.values()][0]?.recurringRuleId).toBe("44444444-4444-4444-4444-444444444444")
  })

  it("cycles.create fails with CycleAlreadyExists for the same window", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)
    const payload = {
      title: null,
      reserveMinor: null,
      estimateMinor: null,
      seedOpeningBalanceMinor: null,
    } as const

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        yield* client("cycles.create", payload, headersFor(token))
        return yield* client("cycles.create", payload, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.create fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(gabrieleId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.create",
          {
            title: null,
            reserveMinor: null,
            estimateMinor: null,
            seedOpeningBalanceMinor: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.list returns summaries ordered by start date with computed figures", async () => {
    const { testLayer, cycles, incomes } = buildTestLayer()
    cycles.set(
      "22222222-2222-2222-2222-222222222222",
      makeCycle({
        id: "22222222-2222-2222-2222-222222222222",
        cycleKey: "2026-02",
        startDate: utc("2026-02-01T00:00:00.000Z"),
        endDate: utc("2026-02-28T00:00:00.000Z"),
      }),
    )
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({
        id: "11111111-1111-1111-1111-111111111111",
        cycleKey: "2026-01",
        startDate: utc("2026-01-01T00:00:00.000Z"),
        endDate: utc("2026-01-31T00:00:00.000Z"),
        seedOpeningBalanceMinor: 10_000,
      }),
    )
    incomes.set("55555555-5555-5555-5555-555555555555", {
      id: "55555555-5555-5555-5555-555555555555",
      cycleId: "11111111-1111-1111-1111-111111111111",
      memberUserId: marceloId,
      kind: "salary",
      amountMinor: 300_000,
      currency: "EUR",
      createdAt: utc("2026-01-01T00:00:00.000Z"),
      updatedAt: utc("2026-01-01T00:00:00.000Z"),
    })
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client("cycles.list", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.map((c) => c.cycleKey)).toEqual(["2026-01", "2026-02"])
      expect(exit.value[0]?.surplus).toBe(310_000)
    }
  })

  it("cycles.list fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(gabrieleId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client("cycles.list", undefined, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.get returns the full detail view", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({ id: "11111111-1111-1111-1111-111111111111", cycleKey: "2026-01" }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.get",
          { id: "11111111-1111-1111-1111-111111111111" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.cycle.cycleKey).toBe("2026-01")
      expect(exit.value.incomes).toEqual([])
      expect(exit.value.transfers).toEqual([])
      expect(exit.value.caps).toEqual([])
    }
  })

  it("cycles.get fails with CycleNotFound for an unknown id", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.get",
          { id: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.getCurrent returns the cycle containing today", async () => {
    const { testLayer, cycles } = buildTestLayer()
    const now = new Date()
    const start = new Date(now.getTime() - 5 * 86_400_000)
    const end = new Date(now.getTime() + 5 * 86_400_000)
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({
        id: "11111111-1111-1111-1111-111111111111",
        cycleKey: "current",
        startDate: DateTime.unsafeFromDate(start),
        endDate: DateTime.unsafeFromDate(end),
      }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client("cycles.getCurrent", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value?.cycle.cycleKey).toBe("current")
    }
  })

  it("cycles.getCurrent returns null when no cycle contains today", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client("cycles.getCurrent", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toBeNull()
    }
  })

  it("cycles.update updates an open cycle", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({ id: "11111111-1111-1111-1111-111111111111", cycleKey: "2026-01" }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.update",
          {
            id: "11111111-1111-1111-1111-111111111111",
            title: "Renomeado",
            reserveMinor: 5_000,
            estimateMinor: null,
            surplusGoalId: null,
            surplusDestinationLabel: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.title).toBe("Renomeado")
    }
  })

  it("cycles.update fails with CycleNotFound for an unknown id", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.update",
          {
            id: "00000000-0000-0000-0000-000000000000",
            title: null,
            reserveMinor: 0,
            estimateMinor: null,
            surplusGoalId: null,
            surplusDestinationLabel: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.update fails with CycleClosed for a closed cycle", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({
        id: "11111111-1111-1111-1111-111111111111",
        cycleKey: "2026-01",
        status: "closed",
      }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.update",
          {
            id: "11111111-1111-1111-1111-111111111111",
            title: null,
            reserveMinor: 0,
            estimateMinor: null,
            surplusGoalId: null,
            surplusDestinationLabel: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.close closes an open cycle", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({ id: "11111111-1111-1111-1111-111111111111", cycleKey: "2026-01" }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.close",
          { id: "11111111-1111-1111-1111-111111111111" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.status).toBe("closed")
    }
  })

  it("cycles.close fails with CycleClosed for an already-closed cycle", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({
        id: "11111111-1111-1111-1111-111111111111",
        cycleKey: "2026-01",
        status: "closed",
      }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.close",
          { id: "11111111-1111-1111-1111-111111111111" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.close fails with CycleNotFound for an unknown id", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.close",
          { id: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.setIncome upserts a member's income in the household's base currency", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({ id: "11111111-1111-1111-1111-111111111111", cycleKey: "2026-01" }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.setIncome",
          {
            cycleId: "11111111-1111-1111-1111-111111111111",
            memberUserId: marceloId,
            kind: "salary",
            amountMinor: 300_000,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.currency).toBe("EUR")
      expect(exit.value.amountMinor).toBe(300_000)
    }
  })

  it("cycles.setIncome fails with CycleNotFound for an unknown cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.setIncome",
          {
            cycleId: "00000000-0000-0000-0000-000000000000",
            memberUserId: marceloId,
            kind: "salary",
            amountMinor: 300_000,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.setIncome fails with CycleClosed for a closed cycle", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({
        id: "11111111-1111-1111-1111-111111111111",
        cycleKey: "2026-01",
        status: "closed",
      }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.setIncome",
          {
            cycleId: "11111111-1111-1111-1111-111111111111",
            memberUserId: marceloId,
            kind: "salary",
            amountMinor: 300_000,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.recordTransfer records a withdrawal in the household's base currency", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({ id: "11111111-1111-1111-1111-111111111111", cycleKey: "2026-01" }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.recordTransfer",
          {
            cycleId: "11111111-1111-1111-1111-111111111111",
            memberUserId: marceloId,
            direction: "to_personal",
            amountMinor: 50_000,
            method: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.currency).toBe("EUR")
      expect(exit.value.direction).toBe("to_personal")
    }
  })

  it("cycles.recordTransfer fails with CycleNotFound for an unknown cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.recordTransfer",
          {
            cycleId: "00000000-0000-0000-0000-000000000000",
            memberUserId: marceloId,
            direction: "to_personal",
            amountMinor: 50_000,
            method: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.recordTransfer fails with CycleClosed for a closed cycle", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({
        id: "11111111-1111-1111-1111-111111111111",
        cycleKey: "2026-01",
        status: "closed",
      }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.recordTransfer",
          {
            cycleId: "11111111-1111-1111-1111-111111111111",
            memberUserId: marceloId,
            direction: "to_personal",
            amountMinor: 50_000,
            method: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.settleTransfer settles an existing transfer", async () => {
    const { testLayer, transfers } = buildTestLayer()
    transfers.set("33333333-3333-3333-3333-333333333333", {
      id: "33333333-3333-3333-3333-333333333333",
      cycleId: "11111111-1111-1111-1111-111111111111",
      memberUserId: marceloId,
      direction: "to_personal",
      amountMinor: 50_000,
      currency: "EUR",
      settledAt: null,
      method: null,
      createdAt: utc("2026-01-01T00:00:00.000Z"),
    })
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.settleTransfer",
          { transferId: "33333333-3333-3333-3333-333333333333" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.settledAt).not.toBeNull()
    }
  })

  it("cycles.settleTransfer fails with MemberTransferNotFound for an unknown transfer", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.settleTransfer",
          { transferId: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.setCategoryCaps replaces the caps for a cycle", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({ id: "11111111-1111-1111-1111-111111111111", cycleKey: "2026-01" }),
    )
    const token = await signAccessToken(marceloId)
    const categoryId = "11111111-1111-1111-1111-111111111111"

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.setCategoryCaps",
          {
            cycleId: "11111111-1111-1111-1111-111111111111",
            caps: [{ categoryId, capMinor: 40_000 }],
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toEqual([{ categoryId, capMinor: 40_000 }])
    }
  })

  it("cycles.setCategoryCaps fails with CycleNotFound for an unknown cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.setCategoryCaps",
          { cycleId: "00000000-0000-0000-0000-000000000000", caps: [] },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.trends summarizes closed cycles and averages the savings rate", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({
        id: "11111111-1111-1111-1111-111111111111",
        cycleKey: "2026-01",
        status: "closed",
        closedAt: utc("2026-02-01T00:00:00.000Z"),
      }),
    )
    cycles.set(
      "22222222-2222-2222-2222-222222222222",
      makeCycle({
        id: "22222222-2222-2222-2222-222222222222",
        cycleKey: "2026-02",
        startDate: utc("2026-02-01T00:00:00.000Z"),
        endDate: utc("2026-02-28T00:00:00.000Z"),
      }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client("cycles.trends", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.cycles).toHaveLength(1)
      expect(exit.value.cycles[0]?.cycleKey).toBe("2026-01")
    }
  })

  it("cycles.trends reports zero average savings when there are no closed cycles", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client("cycles.trends", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.averageSavingsRate).toBe(0)
      expect(exit.value.yearlyTotalSavedMinor).toBe(0)
    }
  })

  it("cycles.compare returns both cycles' detail views", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({ id: "11111111-1111-1111-1111-111111111111", cycleKey: "2026-01" }),
    )
    cycles.set(
      "22222222-2222-2222-2222-222222222222",
      makeCycle({
        id: "22222222-2222-2222-2222-222222222222",
        cycleKey: "2026-02",
        startDate: utc("2026-02-01T00:00:00.000Z"),
        endDate: utc("2026-02-28T00:00:00.000Z"),
      }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.compare",
          {
            cycleIdA: "11111111-1111-1111-1111-111111111111",
            cycleIdB: "22222222-2222-2222-2222-222222222222",
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.a.cycle.cycleKey).toBe("2026-01")
      expect(exit.value.b.cycle.cycleKey).toBe("2026-02")
    }
  })

  it("cycles.compare fails with CycleNotFound when a cycle is missing", async () => {
    const { testLayer, cycles } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({ id: "11111111-1111-1111-1111-111111111111", cycleKey: "2026-01" }),
    )
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.compare",
          {
            cycleIdA: "11111111-1111-1111-1111-111111111111",
            cycleIdB: "00000000-0000-0000-0000-000000000000",
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("cycles.compare fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(gabrieleId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.compare",
          {
            cycleIdA: "11111111-1111-1111-1111-111111111111",
            cycleIdB: "22222222-2222-2222-2222-222222222222",
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("dies when the caller's household settings row is missing", async () => {
    const { testLayer, cycles, settings } = buildTestLayer()
    cycles.set(
      "11111111-1111-1111-1111-111111111111",
      makeCycle({ id: "11111111-1111-1111-1111-111111111111", cycleKey: "2026-01" }),
    )
    settings.delete(householdId)
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CyclesRpcs, { flatten: true })
        return yield* client(
          "cycles.setIncome",
          {
            cycleId: "11111111-1111-1111-1111-111111111111",
            memberUserId: marceloId,
            kind: "salary",
            amountMinor: 1,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause._tag).toBe("Die")
    }
  })
})
