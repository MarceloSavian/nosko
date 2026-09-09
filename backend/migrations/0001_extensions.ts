import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql.unsafe(`CREATE EXTENSION IF NOT EXISTS pgcrypto`)
  yield* sql.unsafe(`CREATE EXTENSION IF NOT EXISTS citext`)
})
