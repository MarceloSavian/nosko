import { SqlClient } from "@effect/sql"
import { Effect, Option } from "effect"
import { HouseholdsRepository } from "../../data/protocols/HouseholdsRepository"

export interface RequestScope {
  readonly userId: string
  readonly householdId?: string
}

export const withRlsScope = <A, E, R>(scope: RequestScope, effect: Effect.Effect<A, E, R>) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    return yield* sql
      .withTransaction(
        Effect.gen(function* () {
          yield* sql`select set_config('app.user_id', ${scope.userId}, true)`.pipe(Effect.orDie)
          if (scope.householdId !== undefined) {
            yield* sql`select set_config('app.household_id', ${scope.householdId}, true)`.pipe(
              Effect.orDie,
            )
          }
          return yield* effect
        }),
      )
      .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)))
  })

export const withAuthenticatedScope = <A, E, R>(
  userId: string,
  effect: (householdId: string | null) => Effect.Effect<A, E, R>,
) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const households = yield* HouseholdsRepository
    return yield* sql
      .withTransaction(
        Effect.gen(function* () {
          yield* sql`select set_config('app.user_id', ${userId}, true)`.pipe(Effect.orDie)
          const membership = yield* households.findMembershipByUserId(userId).pipe(Effect.orDie)
          const householdId = Option.isSome(membership) ? membership.value.householdId : null
          if (householdId !== null) {
            yield* sql`select set_config('app.household_id', ${householdId}, true)`.pipe(
              Effect.orDie,
            )
          }
          return yield* effect(householdId)
        }),
      )
      .pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)))
  })
