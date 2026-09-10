import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`DROP POLICY households_select ON households`)
  yield* sql.unsafe(`
    CREATE POLICY households_select ON households FOR SELECT
      USING (
        id = nullif(current_setting('app.household_id', true), '')::uuid
        OR created_by = nullif(current_setting('app.user_id', true), '')::uuid
      )
  `)
})
