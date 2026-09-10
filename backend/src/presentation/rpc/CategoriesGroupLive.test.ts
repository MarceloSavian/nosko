import * as RpcTest from "@effect/rpc/RpcTest"
import { describe, expect, it } from "@jest/globals"
import { CategoriesRpcs } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Exit, Layer, type Scope } from "effect"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import {
  makeFakeCategoriesRepository,
  makeFakeHouseholdsRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthMiddlewareLive } from "./AuthMiddlewareLive"
import { CategoriesGroupLive } from "./CategoriesGroupLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const marceloId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae9"

const buildTestLayer = (options: { withHousehold?: boolean } = {}) => {
  const { withHousehold = true } = options
  const { layer: sqlLayer } = makeTestSqlClient(() => [])
  const categoriesRepo = makeFakeCategoriesRepository(
    withHousehold
      ? [
          {
            id: "8c9e6679-7425-40de-944b-e07fc1f90ae1",
            householdId,
            scope: "household",
            ownerUserId: null,
            name: "Mercado & Feira",
            color: null,
            sortOrder: 0,
          },
        ]
      : [],
  )
  const householdsRepo = makeFakeHouseholdsRepository({
    households: withHousehold
      ? [
          {
            id: householdId,
            name: "Casa",
            baseCurrency: "EUR",
            createdBy: marceloId,
            createdAt: DateTime.unsafeFromDate(new Date()),
            updatedAt: DateTime.unsafeFromDate(new Date()),
          },
        ]
      : [],
    members: withHousehold
      ? [
          {
            householdId,
            userId: marceloId,
            role: "owner",
            displayName: null,
            joinedAt: DateTime.unsafeFromDate(new Date()),
          },
        ]
      : [],
  })

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    categoriesRepo.layer,
    householdsRepo.layer,
    AccessTokensLive,
  )

  const testLayer = Layer.mergeAll(CategoriesGroupLive, AuthMiddlewareLive).pipe(
    Layer.provide(infraLayer),
  )

  return { testLayer }
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

describe("CategoriesGroupLive", () => {
  it("categories.list returns the household's categories", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CategoriesRpcs, { flatten: true })
        return yield* client("categories.list", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.map((c) => c.name)).toEqual(["Mercado & Feira"])
    }
  })

  it("categories.list fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer({ withHousehold: false })
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(CategoriesRpcs, { flatten: true })
        return yield* client("categories.list", undefined, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })
})
