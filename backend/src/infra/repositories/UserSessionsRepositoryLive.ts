import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { UserSessionsRepository } from "../../data/protocols/UserSessionsRepository"
import { UserSession } from "../../domain/models/UserSession"
import { decodeRow } from "./decode"

export const UserSessionsRepositoryLive = Layer.effect(
  UserSessionsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeSession = decodeRow(UserSession)
    const decodeOption = (rows: ReadonlyArray<unknown>) =>
      rows.length === 0
        ? Effect.succeed(Option.none())
        : decodeSession(rows[0]).pipe(Effect.map(Option.some))
    const scopeToUser = (userId: string) => sql`select set_config('app.user_id', ${userId}, true)`

    return {
      create: (input) =>
        Effect.gen(function* () {
          yield* scopeToUser(input.userId)
          const rows = yield* sql`INSERT INTO ${sql("userSessions")} ${sql.insert({
            userId: input.userId,
            refreshTokenHash: input.refreshTokenHash,
            deviceLabel: input.deviceLabel,
            mfaTrustedUntil: input.mfaTrustedUntil,
            expiresAt: input.expiresAt,
          })} RETURNING *`
          return yield* decodeSession(rows[0])
        }),
      findById: (id) =>
        sql`SELECT * FROM ${sql("userSessions")} WHERE id = ${id}`.pipe(
          Effect.flatMap(decodeOption),
        ),
      findByRefreshTokenHash: (userId, refreshTokenHash) =>
        Effect.gen(function* () {
          yield* scopeToUser(userId)
          const rows = yield* sql`SELECT * FROM ${sql("userSessions")}
            WHERE ${sql("userId")} = ${userId}
              AND ${sql("refreshTokenHash")} = ${refreshTokenHash}
              AND ${sql("revokedAt")} IS NULL
              AND ${sql("expiresAt")} > now()`
          return yield* decodeOption(rows)
        }),
      listByUser: (userId) =>
        sql`SELECT * FROM ${sql("userSessions")} WHERE ${sql("userId")} = ${userId} ORDER BY ${sql("createdAt")} DESC`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeSession)),
        ),
      revoke: (id) =>
        sql`UPDATE ${sql("userSessions")} SET ${sql.update({
          revokedAt: new Date(),
        })} WHERE id = ${id}`.pipe(Effect.asVoid),
      revokeAllForUser: (userId) =>
        sql`UPDATE ${sql("userSessions")} SET ${sql.update({
          revokedAt: new Date(),
        })} WHERE ${sql("userId")} = ${userId} AND ${sql("revokedAt")} IS NULL`.pipe(Effect.asVoid),
    }
  }),
)
