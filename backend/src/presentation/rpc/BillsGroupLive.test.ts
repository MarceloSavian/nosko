import * as RpcTest from "@effect/rpc/RpcTest"
import { describe, expect, it } from "@jest/globals"
import { BillsRpcs } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Exit, Layer, type Scope } from "effect"
import type { Cycle } from "../../domain/models/Cycle"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import {
  makeFakeCyclesRepository,
  makeFakeFixedBillsRepository,
  makeFakeHouseholdsRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthMiddlewareLive } from "./AuthMiddlewareLive"
import { BillsGroupLive } from "./BillsGroupLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const marceloId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const gabrieleId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"
const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae9"
const cycleId = "11111111-1111-1111-1111-111111111111"
const closedCycleId = "22222222-2222-2222-2222-222222222222"

const utc = (iso: string) => DateTime.unsafeFromDate(new Date(iso))

const buildTestLayer = () => {
  const { layer: sqlLayer } = makeTestSqlClient(() => [])
  const cyclesFake = makeFakeCyclesRepository()
  const billsFake = makeFakeFixedBillsRepository()
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
    estimateMinor: null,
    seedOpeningBalanceMinor: null,
    surplusGoalId: null,
    surplusDestinationLabel: null,
    createdAt: utc("2026-01-01T00:00:00.000Z"),
    updatedAt: utc("2026-01-01T00:00:00.000Z"),
  }
  cyclesFake.cycles.set(cycleId, openCycle)
  cyclesFake.cycles.set(closedCycleId, { ...openCycle, id: closedCycleId, status: "closed" })

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    cyclesFake.layer,
    billsFake.layer,
    householdsFake.layer,
    AccessTokensLive,
  )

  const testLayer = Layer.mergeAll(BillsGroupLive, AuthMiddlewareLive).pipe(
    Layer.provide(infraLayer),
  )

  return { testLayer, bills: billsFake.bills }
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

const newBillPayload = (overrides: Partial<{ cycleId: string; label: string }> = {}) => ({
  cycleId,
  recurringRuleId: null,
  label: "Aluguel",
  amountMinor: 150_000,
  payingAccountId: null,
  dueDay: 5,
  categoryId: null,
  sortOrder: 0,
  ...overrides,
})

describe("BillsGroupLive", () => {
  it("bills.create creates a fixed bill in the household's base currency", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        return yield* client("bills.create", newBillPayload(), headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.label).toBe("Aluguel")
      expect(exit.value.currency).toBe("EUR")
    }
  })

  it("bills.create fails with CycleNotFound for an unknown cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        return yield* client(
          "bills.create",
          newBillPayload({ cycleId: "00000000-0000-0000-0000-000000000000" }),
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("bills.create fails with CycleClosed for a closed cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        return yield* client(
          "bills.create",
          newBillPayload({ cycleId: closedCycleId }),
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("bills.create fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(gabrieleId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        return yield* client("bills.create", newBillPayload(), headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("bills.list lists bills for a cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        yield* client("bills.create", newBillPayload(), headersFor(token))
        return yield* client("bills.list", { cycleId }, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toHaveLength(1)
    }
  })

  it("bills.list fails with CycleNotFound for an unknown cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        return yield* client(
          "bills.list",
          { cycleId: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("bills.list fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(gabrieleId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        return yield* client("bills.list", { cycleId }, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("bills.update updates an existing bill on an open cycle", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        const created = yield* client("bills.create", newBillPayload(), headersFor(token))
        return yield* client(
          "bills.update",
          {
            id: created.id,
            label: "Aluguel novo",
            amountMinor: 160_000,
            payingAccountId: null,
            dueDay: 10,
            categoryId: null,
            sortOrder: 1,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.label).toBe("Aluguel novo")
    }
  })

  it("bills.update fails with FixedBillNotFound for an unknown bill", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        return yield* client(
          "bills.update",
          {
            id: "00000000-0000-0000-0000-000000000000",
            label: "Nope",
            amountMinor: 0,
            payingAccountId: null,
            dueDay: null,
            categoryId: null,
            sortOrder: 0,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("bills.update fails with CycleClosed when the bill's cycle is closed", async () => {
    const { testLayer, bills } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        const created = yield* client(
          "bills.create",
          newBillPayload({ cycleId }),
          headersFor(token),
        )
        const bill = bills.get(created.id)
        if (bill) bills.set(created.id, { ...bill, cycleId: closedCycleId })
        return yield* client(
          "bills.update",
          {
            id: created.id,
            label: "Nope",
            amountMinor: 0,
            payingAccountId: null,
            dueDay: null,
            categoryId: null,
            sortOrder: 0,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("bills.setPaid marks a bill paid", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        const created = yield* client("bills.create", newBillPayload(), headersFor(token))
        return yield* client(
          "bills.setPaid",
          { id: created.id, paid: true, paidOnDay: 5 },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.paid).toBe(true)
    }
  })

  it("bills.setPaid fails with FixedBillNotFound for an unknown bill", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        return yield* client(
          "bills.setPaid",
          { id: "00000000-0000-0000-0000-000000000000", paid: true, paidOnDay: 1 },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("bills.remove removes a bill on an open cycle", async () => {
    const { testLayer, bills } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        const created = yield* client("bills.create", newBillPayload(), headersFor(token))
        yield* client("bills.remove", { id: created.id }, headersFor(token))
        return created.id
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(bills.size).toBe(0)
  })

  it("bills.remove fails with FixedBillNotFound for an unknown bill", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        return yield* client(
          "bills.remove",
          { id: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("dies if the bill's cycle row is gone by the time the handler runs", async () => {
    const { testLayer, bills } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        const created = yield* client("bills.create", newBillPayload(), headersFor(token))
        const bill = bills.get(created.id)
        if (bill)
          bills.set(created.id, { ...bill, cycleId: "00000000-0000-0000-0000-000000000000" })
        return yield* client(
          "bills.update",
          {
            id: created.id,
            label: "Nope",
            amountMinor: 0,
            payingAccountId: null,
            dueDay: null,
            categoryId: null,
            sortOrder: 0,
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

  it("bills.remove fails with CycleClosed when the bill's cycle is closed", async () => {
    const { testLayer, bills } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(BillsRpcs, { flatten: true })
        const created = yield* client(
          "bills.create",
          newBillPayload({ cycleId }),
          headersFor(token),
        )
        const bill = bills.get(created.id)
        if (bill) bills.set(created.id, { ...bill, cycleId: closedCycleId })
        return yield* client("bills.remove", { id: created.id }, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })
})
