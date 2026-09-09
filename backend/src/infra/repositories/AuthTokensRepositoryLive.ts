import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { AuthTokensRepository } from "../../data/protocols/AuthTokensRepository"
import { AuthToken } from "../../domain/models/AuthToken"
import { decodeRow } from "./decode"

export const AuthTokensRepositoryLive = Layer.effect(
  AuthTokensRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeToken = decodeRow(AuthToken)

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("authTokens")} ${sql.insert({
          userId: input.userId,
          type: input.type,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        })} RETURNING *`.pipe(Effect.flatMap((rows) => decodeToken(rows[0]))),
      findValid: (userId, type, tokenHash) =>
        sql`SELECT * FROM ${sql("authTokens")}
            WHERE ${sql("userId")} = ${userId}
              AND type = ${type}
              AND ${sql("tokenHash")} = ${tokenHash}
              AND ${sql("consumedAt")} IS NULL
              AND ${sql("expiresAt")} > now()`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeToken(rows[0]).pipe(Effect.map(Option.some)),
          ),
        ),
      consume: (id) =>
        sql`UPDATE ${sql("authTokens")} SET ${sql.update({
          consumedAt: new Date(),
        })} WHERE id = ${id}`.pipe(Effect.asVoid),
    }
  }),
)
