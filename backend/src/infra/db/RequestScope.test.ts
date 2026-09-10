import { describe, expect, it } from "@jest/globals"
import { DateTime, Effect } from "effect"
import { makeFakeHouseholdsRepository } from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { withAuthenticatedScope, withRlsScope } from "./RequestScope"

describe("withRlsScope", () => {
  it("scopes app.user_id and app.household_id inside one transaction", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    const result = await Effect.runPromise(
      withRlsScope({ userId: "user-1", householdId: "household-1" }, Effect.succeed("done")).pipe(
        Effect.provide(layer),
      ),
    )

    expect(result).toBe("done")
    expect(queries.map((q) => q.sql)).toEqual([
      "BEGIN",
      "select set_config('app.user_id', $1, true)",
      "select set_config('app.household_id', $1, true)",
      "COMMIT",
    ])
    expect(queries[1]?.params).toEqual(["user-1"])
    expect(queries[2]?.params).toEqual(["household-1"])
  })

  it("only scopes app.user_id when no household is known yet", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      withRlsScope({ userId: "user-1" }, Effect.succeed("done")).pipe(Effect.provide(layer)),
    )

    expect(queries.map((q) => q.sql)).toEqual([
      "BEGIN",
      "select set_config('app.user_id', $1, true)",
      "COMMIT",
    ])
  })

  it("rolls back the transaction when the scoped effect fails", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    const exit = await Effect.runPromiseExit(
      withRlsScope({ userId: "user-1" }, Effect.fail("nope")).pipe(Effect.provide(layer)),
    )

    expect(exit._tag).toBe("Failure")
    expect(queries.map((q) => q.sql)).toEqual([
      "BEGIN",
      "select set_config('app.user_id', $1, true)",
      "ROLLBACK",
    ])
  })
})

describe("withAuthenticatedScope", () => {
  it("also scopes app.household_id when the user belongs to a household", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])
    const { layer: householdsLayer } = makeFakeHouseholdsRepository({
      members: [
        {
          householdId: "household-1",
          userId: "user-1",
          role: "owner",
          displayName: null,
          joinedAt: DateTime.unsafeFromDate(new Date("2026-01-01T00:00:00.000Z")),
        },
      ],
    })

    const householdIds: Array<string | null> = []
    await Effect.runPromise(
      withAuthenticatedScope("user-1", (householdId) => {
        householdIds.push(householdId)
        return Effect.succeed("done")
      }).pipe(Effect.provide(householdsLayer), Effect.provide(layer)),
    )

    expect(queries.map((q) => q.sql)).toEqual([
      "BEGIN",
      "select set_config('app.user_id', $1, true)",
      "select set_config('app.household_id', $1, true)",
      "COMMIT",
    ])
    expect(queries[1]?.params).toEqual(["user-1"])
    expect(queries[2]?.params).toEqual(["household-1"])
    expect(householdIds).toEqual(["household-1"])
  })

  it("only scopes app.user_id when the user has no household yet", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])
    const { layer: householdsLayer } = makeFakeHouseholdsRepository()

    const householdIds: Array<string | null> = []
    await Effect.runPromise(
      withAuthenticatedScope("user-1", (householdId) => {
        householdIds.push(householdId)
        return Effect.succeed("done")
      }).pipe(Effect.provide(householdsLayer), Effect.provide(layer)),
    )

    expect(queries.map((q) => q.sql)).toEqual([
      "BEGIN",
      "select set_config('app.user_id', $1, true)",
      "COMMIT",
    ])
    expect(householdIds).toEqual([null])
  })
})
