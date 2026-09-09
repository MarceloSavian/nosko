import { PgClient } from "@effect/sql-pg"
import { Config, String as Str } from "effect"

export const PgLive = PgClient.layerConfig({
  url: Config.redacted("DATABASE_URL"),
  transformResultNames: Config.succeed(Str.snakeToCamel),
  transformQueryNames: Config.succeed(Str.camelToSnake),
})
