import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`DROP POLICY household_members_insert ON household_members`)
  yield* sql.unsafe(`
    CREATE POLICY household_members_insert ON household_members FOR INSERT
      WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  `)

  yield* sql.unsafe(`DROP POLICY household_invitations_household ON household_invitations`)
  yield* sql.unsafe(`
    CREATE POLICY household_invitations_household ON household_invitations
      USING (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        OR email = (
          SELECT email FROM users
          WHERE id = nullif(current_setting('app.user_id', true), '')::uuid
        )
      )
      WITH CHECK (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        OR email = (
          SELECT email FROM users
          WHERE id = nullif(current_setting('app.user_id', true), '')::uuid
        )
      )
  `)
})
