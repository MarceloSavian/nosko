import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`
    CREATE TABLE category_caps (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
      category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      cap_minor bigint NOT NULL,
      CONSTRAINT category_caps_unique UNIQUE (cycle_id, category_id)
    )
  `)
  yield* sql.unsafe(`CREATE INDEX category_caps_cycle_id_idx ON category_caps (cycle_id)`)
  yield* sql.unsafe(`ALTER TABLE category_caps ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE category_caps FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY category_caps_household ON category_caps
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON category_caps TO app_role`)
})
