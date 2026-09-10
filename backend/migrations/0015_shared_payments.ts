import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`
    CREATE TABLE shared_payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
      account_id uuid NOT NULL REFERENCES accounts(id),
      booked_at date NOT NULL,
      description text NOT NULL,
      counterparty text,
      amount_minor bigint NOT NULL,
      currency char(3) NOT NULL,
      amount_base_minor bigint NOT NULL,
      fx_rate numeric(14, 6),
      category_id uuid NOT NULL REFERENCES categories(id),
      created_by uuid NOT NULL REFERENCES users(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(`CREATE INDEX shared_payments_cycle_id_idx ON shared_payments (cycle_id)`)
  yield* sql.unsafe(
    `CREATE INDEX shared_payments_household_booked_idx ON shared_payments (household_id, booked_at)`,
  )
  yield* sql.unsafe(`ALTER TABLE shared_payments ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE shared_payments FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY shared_payments_household ON shared_payments
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON shared_payments TO app_role`)
})
