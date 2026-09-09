import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`CREATE TYPE category_scope AS ENUM ('household', 'personal')`)
  yield* sql.unsafe(`
    CREATE TABLE categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      scope category_scope NOT NULL,
      owner_user_id uuid REFERENCES users(id),
      name text NOT NULL,
      color text,
      sort_order int NOT NULL DEFAULT 0,
      CONSTRAINT categories_scope_owner_check CHECK (
        (scope = 'household' AND owner_user_id IS NULL)
        OR (scope = 'personal' AND owner_user_id IS NOT NULL)
      )
    )
  `)
  yield* sql.unsafe(`
    CREATE UNIQUE INDEX categories_household_scope_unique ON categories (household_id, name)
      WHERE scope = 'household'
  `)
  yield* sql.unsafe(`
    CREATE UNIQUE INDEX categories_personal_scope_unique ON categories (household_id, owner_user_id, name)
      WHERE scope = 'personal'
  `)
  yield* sql.unsafe(`ALTER TABLE categories ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE categories FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY categories_select ON categories FOR SELECT
      USING (
        (scope = 'household' AND household_id = nullif(current_setting('app.household_id', true), '')::uuid)
        OR (scope = 'personal' AND owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      )
  `)
  yield* sql.unsafe(`
    CREATE POLICY categories_insert ON categories FOR INSERT
      WITH CHECK (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        AND (
          (scope = 'household' AND owner_user_id IS NULL)
          OR (scope = 'personal' AND owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
        )
      )
  `)
  yield* sql.unsafe(`
    CREATE POLICY categories_update ON categories FOR UPDATE
      USING (
        (scope = 'household' AND household_id = nullif(current_setting('app.household_id', true), '')::uuid)
        OR (scope = 'personal' AND owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      )
      WITH CHECK (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        AND (
          (scope = 'household' AND owner_user_id IS NULL)
          OR (scope = 'personal' AND owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
        )
      )
  `)
  yield* sql.unsafe(`
    CREATE POLICY categories_delete ON categories FOR DELETE
      USING (
        (scope = 'household' AND household_id = nullif(current_setting('app.household_id', true), '')::uuid)
        OR (scope = 'personal' AND owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      )
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO app_role`)
})
