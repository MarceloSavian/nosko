import * as RpcTest from "@effect/rpc/RpcTest"
import { describe, expect, it } from "@jest/globals"
import { RulesRpcs } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Exit, Layer, type Scope } from "effect"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import {
  makeFakeHouseholdsRepository,
  makeFakeRecurringRulesRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthMiddlewareLive } from "./AuthMiddlewareLive"
import { RulesGroupLive } from "./RulesGroupLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const marceloId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const gabrieleId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"
const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae9"

const buildTestLayer = () => {
  const { layer: sqlLayer } = makeTestSqlClient(() => [])
  const rulesFake = makeFakeRecurringRulesRepository()
  const householdsFake = makeFakeHouseholdsRepository({
    households: [
      {
        id: householdId,
        name: "Casa",
        baseCurrency: "EUR",
        createdBy: marceloId,
        createdAt: DateTime.unsafeFromDate(new Date()),
        updatedAt: DateTime.unsafeFromDate(new Date()),
      },
    ],
    members: [
      {
        householdId,
        userId: marceloId,
        role: "owner",
        displayName: null,
        joinedAt: DateTime.unsafeFromDate(new Date()),
      },
    ],
  })

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    rulesFake.layer,
    householdsFake.layer,
    AccessTokensLive,
  )

  const testLayer = Layer.mergeAll(RulesGroupLive, AuthMiddlewareLive).pipe(
    Layer.provide(infraLayer),
  )

  return { testLayer, rules: rulesFake.rules }
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

const newRulePayload = () => ({
  matchType: "vendor_exact" as const,
  matcher: "Netflix",
  expectedAmountMinor: 10_000,
  currency: "EUR",
  categoryId: null,
  cadence: "monthly" as const,
  isFixedBill: false,
})

describe("RulesGroupLive", () => {
  it("rules.create creates a user-defined rule", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(RulesRpcs, { flatten: true })
        return yield* client("rules.create", newRulePayload(), headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.source).toBe("user_defined")
      expect(exit.value.matcher).toBe("Netflix")
    }
  })

  it("rules.create fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(gabrieleId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(RulesRpcs, { flatten: true })
        return yield* client("rules.create", newRulePayload(), headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("rules.list lists all rules for the household", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(RulesRpcs, { flatten: true })
        yield* client("rules.create", newRulePayload(), headersFor(token))
        return yield* client("rules.list", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toHaveLength(1)
    }
  })

  it("rules.list fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(gabrieleId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(RulesRpcs, { flatten: true })
        return yield* client("rules.list", undefined, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("rules.update updates an existing rule", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(RulesRpcs, { flatten: true })
        const created = yield* client("rules.create", newRulePayload(), headersFor(token))
        return yield* client(
          "rules.update",
          {
            id: created.id,
            matcher: "Netflix.com",
            expectedAmountMinor: 12_000,
            currency: "EUR",
            categoryId: null,
            cadence: "monthly",
            isFixedBill: false,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.matcher).toBe("Netflix.com")
    }
  })

  it("rules.update fails with RecurringRuleNotFound for an unknown rule", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(RulesRpcs, { flatten: true })
        return yield* client(
          "rules.update",
          {
            id: "00000000-0000-0000-0000-000000000000",
            matcher: "Nope",
            expectedAmountMinor: null,
            currency: null,
            categoryId: null,
            cadence: "monthly",
            isFixedBill: false,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("rules.deactivate deactivates an existing rule", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(RulesRpcs, { flatten: true })
        const created = yield* client("rules.create", newRulePayload(), headersFor(token))
        return yield* client("rules.deactivate", { id: created.id }, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.active).toBe(false)
    }
  })

  it("rules.deactivate fails with RecurringRuleNotFound for an unknown rule", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(RulesRpcs, { flatten: true })
        return yield* client(
          "rules.deactivate",
          { id: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })
})
