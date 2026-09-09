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

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("userSessions")} ${sql.insert({
          userId: input.userId,
          refreshTokenHash: input.refreshTokenHash,
          deviceLabel: input.deviceLabel,
          mfaTrustedUntil: input.mfaTrustedUntil,
          expiresAt: input.expiresAt,
        })} RETURNING *`.pipe(Effect.flatMap((rows) => decodeSession(rows[0]))),
      findById: (id) =>
        sql`SELECT * FROM ${sql("userSessions")} WHERE id = ${id}`.pipe(
          Effect.flatMap(decodeOption),
        ),
      findByRefreshTokenHash: (userId, refreshTokenHash) =>
        sql`SELECT * FROM ${sql("userSessions")}
            WHERE ${sql("userId")} = ${userId}
              AND ${sql("refreshTokenHash")} = ${refreshTokenHash}
              AND ${sql("revokedAt")} IS NULL
              AND ${sql("expiresAt")} > now()`.pipe(Effect.flatMap(decodeOption)),
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
