import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`DROP POLICY household_members_select ON household_members`)
  yield* sql.unsafe(`
    CREATE POLICY household_members_select ON household_members FOR SELECT
      USING (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        OR user_id = nullif(current_setting('app.user_id', true), '')::uuid
      )
  `)
})
