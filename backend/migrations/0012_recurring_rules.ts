import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(
    `CREATE TYPE rule_match_type AS ENUM ('vendor_exact', 'vendor_contains', 'counterparty')`,
  )
  yield* sql.unsafe(`CREATE TYPE rule_cadence AS ENUM ('monthly', 'yearly', 'irregular')`)
  yield* sql.unsafe(`CREATE TYPE rule_source AS ENUM ('auto_detected', 'user_defined')`)
  yield* sql.unsafe(`
    CREATE TABLE recurring_rules (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      match_type rule_match_type NOT NULL,
      matcher text NOT NULL,
      expected_amount_minor bigint,
      currency char(3),
      category_id uuid REFERENCES categories(id),
      cadence rule_cadence NOT NULL,
      is_fixed_bill boolean NOT NULL DEFAULT false,
      active boolean NOT NULL DEFAULT true,
      source rule_source NOT NULL,
      confidence numeric(4, 3),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(
    `CREATE INDEX recurring_rules_household_active_idx ON recurring_rules (household_id, active)`,
  )
  yield* sql.unsafe(`ALTER TABLE recurring_rules ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE recurring_rules FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY recurring_rules_household ON recurring_rules
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_rules TO app_role`)
})
