import { PgClient } from "@effect/sql-pg"
import { Config, String as Str } from "effect"
import { types } from "pg"

const PG_NUMERIC_OID = 1700
types.setTypeParser(PG_NUMERIC_OID, Number.parseFloat)

export const PgLive = PgClient.layerConfig({
  url: Config.redacted("DATABASE_URL"),
  transformResultNames: Config.succeed(Str.snakeToCamel),
  transformQueryNames: Config.succeed(Str.camelToSnake),
})
