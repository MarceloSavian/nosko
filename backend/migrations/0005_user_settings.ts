import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`
    CREATE TABLE user_settings (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      personal_spend_cap_minor bigint,
      currency char(3) NOT NULL DEFAULT 'EUR',
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(`ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE user_settings FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY user_settings_owner ON user_settings
      USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON user_settings TO app_role`)
})
