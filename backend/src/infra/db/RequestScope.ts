import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export interface RequestScope {
  readonly userId: string
  readonly householdId?: string
}

export const withRlsScope = <A, E, R>(scope: RequestScope, effect: Effect.Effect<A, E, R>) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    return yield* sql.withTransaction(
      Effect.gen(function* () {
        yield* sql`select set_config('app.user_id', ${scope.userId}, true)`
        if (scope.householdId !== undefined) {
          yield* sql`select set_config('app.household_id', ${scope.householdId}, true)`
        }
        return yield* effect
      }),
    )
  })
