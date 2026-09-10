import * as Headers from "@effect/platform/Headers"
import type { Rpc } from "@effect/rpc"
import { describe, expect, it } from "@jest/globals"
import { AuthMiddleware, CurrentUser } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Exit } from "effect"
import type { HouseholdMember } from "../../domain/models/Household"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import { makeFakeHouseholdsRepository } from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthMiddlewareLive } from "./AuthMiddlewareLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const dummyRpc = {} as unknown as Rpc.AnyWithProps

const membership: HouseholdMember = {
  householdId: "household-1",
  userId: "user-1",
  role: "owner",
  displayName: null,
  joinedAt: DateTime.unsafeFromDate(new Date("2026-01-01T00:00:00.000Z")),
}

const runMiddleware = (
  headers: Readonly<Record<string, string>>,
  members: ReadonlyArray<HouseholdMember>,
) => {
  const { layer: sqlLayer, queries } = makeTestSqlClient(() => [])
  const { layer: householdsLayer } = makeFakeHouseholdsRepository({ members })

  const exit = Effect.runPromiseExit(
    Effect.gen(function* () {
      const middleware = yield* AuthMiddleware
      return yield* middleware({
        clientId: 0,
        rpc: dummyRpc,
        payload: undefined,
        headers: Headers.unsafeFromRecord(headers),
        next: Effect.gen(function* () {
          return yield* CurrentUser
        }) as never,
      })
    }).pipe(
      Effect.provide(AuthMiddlewareLive),
      Effect.provide(sqlLayer),
      Effect.provide(householdsLayer),
      Effect.provide(AccessTokensLive),
      Effect.withConfigProvider(withConfig),
    ),
  )

  return { exit, queries }
}

const signAccessToken = () =>
  Effect.runPromise(
    Effect.gen(function* () {
      const accessTokens = yield* AccessTokens
      return yield* accessTokens.sign({ userId: "user-1", sessionId: "session-1" })
    }).pipe(Effect.provide(AccessTokensLive), Effect.withConfigProvider(withConfig)),
  )

describe("AuthMiddlewareLive", () => {
  it("fails with SessionInvalid when there is no access token cookie", async () => {
    const { exit } = runMiddleware({}, [])

    const result = await exit
    expect(result._tag).toBe("Failure")
  })

  it("fails with SessionInvalid for a garbled access token", async () => {
    const { exit } = runMiddleware({ cookie: `${ACCESS_TOKEN_COOKIE}=not-a-real-token` }, [])

    const result = await exit
    expect(result._tag).toBe("Failure")
  })

  it("provides CurrentUser with the household id when the user belongs to one", async () => {
    const token = await signAccessToken()
    const { exit, queries } = runMiddleware({ cookie: `${ACCESS_TOKEN_COOKIE}=${token}` }, [
      membership,
    ])

    const result = await exit
    expect(Exit.isSuccess(result)).toBe(true)
    if (Exit.isSuccess(result)) {
      expect(result.value).toEqual({
        userId: "user-1",
        sessionId: "session-1",
        householdId: "household-1",
      })
    }
    expect(queries.map((q) => q.sql)).toEqual([
      "BEGIN",
      "select set_config('app.user_id', $1, true)",
      "select set_config('app.household_id', $1, true)",
      "COMMIT",
    ])
  })

  it("provides CurrentUser with a null household id when the user has none yet", async () => {
    const token = await signAccessToken()
    const { exit, queries } = runMiddleware({ cookie: `${ACCESS_TOKEN_COOKIE}=${token}` }, [])

    const result = await exit
    expect(Exit.isSuccess(result)).toBe(true)
    if (Exit.isSuccess(result)) {
      expect(result.value).toEqual({
        userId: "user-1",
        sessionId: "session-1",
        householdId: null,
      })
    }
    expect(queries.map((q) => q.sql)).toEqual([
      "BEGIN",
      "select set_config('app.user_id', $1, true)",
      "COMMIT",
    ])
  })
})
