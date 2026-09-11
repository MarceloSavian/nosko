import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { BanksRepository } from "../../data/protocols/BanksRepository"
import { Bank } from "../../domain/models/Bank"
import { decodeRow } from "./decode"

export const BanksRepositoryLive = Layer.effect(
  BanksRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeBank = decodeRow(Bank)

    return {
      findByCode: (code) =>
        sql`SELECT * FROM ${sql("banks")} WHERE ${sql("code")} = ${code}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeBank(rows[0]).pipe(Effect.map(Option.some)),
          ),
        ),
      list: () =>
        sql`SELECT * FROM ${sql("banks")} ORDER BY ${sql("name")}`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeBank)),
        ),
    }
  }),
)
