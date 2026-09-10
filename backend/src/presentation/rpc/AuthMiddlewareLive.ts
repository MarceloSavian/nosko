import { SqlClient } from "@effect/sql"
import { AuthMiddleware, CurrentUser } from "@nosko/contracts"
import { Effect, Layer, Option } from "effect"
import { HouseholdsRepository } from "../../data/protocols/HouseholdsRepository"
import { SessionInvalid } from "../../domain/errors/AuthErrors"
import { AccessTokens } from "../../infra/auth/AccessTokens"
import { readAccessTokenFromHeaders } from "../../infra/auth/SessionCookies"
import { withAuthenticatedScope } from "../../infra/db/RequestScope"

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function* () {
    const accessTokens = yield* AccessTokens
    const sql = yield* SqlClient.SqlClient
    const households = yield* HouseholdsRepository

    return (options) =>
      Effect.gen(function* () {
        const token = readAccessTokenFromHeaders(options.headers)
        if (Option.isNone(token)) {
          return yield* Effect.fail(new SessionInvalid({ reason: "not_found" }))
        }

        const claims = yield* accessTokens.verify(token.value)

        return yield* withAuthenticatedScope(claims.userId, (householdId) =>
          Effect.provideService(options.next, CurrentUser, {
            userId: claims.userId,
            sessionId: claims.sessionId,
            householdId,
          }),
        ).pipe(
          Effect.provideService(SqlClient.SqlClient, sql),
          Effect.provideService(HouseholdsRepository, households),
        )
      })
  }),
)
