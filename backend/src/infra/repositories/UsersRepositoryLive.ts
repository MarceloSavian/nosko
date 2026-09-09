import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { UsersRepository } from "../../data/protocols/UsersRepository"
import { User } from "../../domain/models/User"
import { decodeRow } from "./decode"

export const UsersRepositoryLive = Layer.effect(
  UsersRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeUser = decodeRow(User)

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("users")} ${sql.insert({
          email: input.email,
          passwordHash: input.passwordHash,
          name: input.name,
          preferredLocale: input.preferredLocale,
        })} RETURNING *`.pipe(Effect.flatMap((rows) => decodeUser(rows[0]))),
      findById: (id) =>
        sql`SELECT * FROM ${sql("users")} WHERE id = ${id}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeUser(rows[0]).pipe(Effect.map(Option.some)),
          ),
        ),
    }
  }),
)
