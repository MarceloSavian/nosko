import { PgClient } from "@effect/sql-pg"
import { Config, String as Str } from "effect"
import { types } from "pg"

const PG_NUMERIC_OID = 1700
types.setTypeParser(PG_NUMERIC_OID, Number.parseFloat)

// pg returns bigint (int8) columns as strings by default to avoid silent precision loss beyond
// Number.MAX_SAFE_INTEGER. Every minor-unit currency column (balance_minor, amount_minor, etc.)
// is bigint, and Schema.Int on the wire requires an actual number, so this must be parsed too.
const PG_BIGINT_OID = 20
types.setTypeParser(PG_BIGINT_OID, (value) => Number.parseInt(value, 10))

export const PgLive = PgClient.layerConfig({
  url: Config.redacted("DATABASE_URL"),
  transformResultNames: Config.succeed(Str.snakeToCamel),
  transformQueryNames: Config.succeed(Str.camelToSnake),
})
