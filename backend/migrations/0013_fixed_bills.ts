import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`
    CREATE TABLE fixed_bills (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      recurring_rule_id uuid REFERENCES recurring_rules(id),
      label text NOT NULL,
      amount_minor bigint NOT NULL,
      currency char(3) NOT NULL,
      paid boolean NOT NULL DEFAULT false,
      paid_on_day int,
      paying_account_id uuid REFERENCES accounts(id),
      due_day int,
      auto_paid boolean NOT NULL DEFAULT false,
      category_id uuid REFERENCES categories(id),
      sort_order int NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(`CREATE INDEX fixed_bills_cycle_id_idx ON fixed_bills (cycle_id)`)
  yield* sql.unsafe(`ALTER TABLE fixed_bills ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE fixed_bills FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY fixed_bills_household ON fixed_bills
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON fixed_bills TO app_role`)
})
