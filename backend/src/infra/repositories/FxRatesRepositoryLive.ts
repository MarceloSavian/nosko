import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { FxRatesRepository } from "../../data/protocols/FxRatesRepository"
import { FxRate } from "../../domain/models/FxRate"
import { decodeRow } from "./decode"

export const FxRatesRepositoryLive = Layer.effect(
  FxRatesRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeFxRate = decodeRow(FxRate)

    return {
      upsert: (input) =>
        sql`
          INSERT INTO ${sql("fxRates")} (rate_date, base, quote, rate)
          VALUES (${input.rateDate}, ${input.base}, ${input.quote}, ${input.rate})
          ON CONFLICT (rate_date, base, quote) DO UPDATE SET rate = excluded.rate
          RETURNING *
        `.pipe(Effect.flatMap((rows) => decodeFxRate(rows[0]))),
      findOnOrBefore: (base, quote, date) =>
        sql`
          SELECT * FROM ${sql("fxRates")}
          WHERE base = ${base} AND quote = ${quote} AND ${sql("rateDate")} <= ${date}
          ORDER BY ${sql("rateDate")} DESC
          LIMIT 1
        `.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeFxRate(rows[0]).pipe(Effect.map(Option.some)),
          ),
        ),
    }
  }),
)
