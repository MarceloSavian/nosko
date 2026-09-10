import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`CREATE TYPE cycle_status AS ENUM ('open', 'closed')`)
  yield* sql.unsafe(`
    CREATE TABLE cycles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      cycle_key text NOT NULL,
      title text,
      start_date date NOT NULL,
      end_date date NOT NULL,
      status cycle_status NOT NULL DEFAULT 'open',
      closed_at timestamptz,
      reserve_minor bigint NOT NULL DEFAULT 0,
      estimate_minor bigint,
      seed_opening_balance_minor bigint,
      surplus_goal_id uuid,
      surplus_destination_label text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT cycles_household_key_unique UNIQUE (household_id, cycle_key),
      CONSTRAINT cycles_dates_check CHECK (end_date >= start_date)
    )
  `)
  yield* sql.unsafe(`CREATE INDEX cycles_household_start_idx ON cycles (household_id, start_date)`)
  yield* sql.unsafe(`ALTER TABLE cycles ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE cycles FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY cycles_household ON cycles
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON cycles TO app_role`)

  yield* sql.unsafe(`CREATE TYPE income_kind AS ENUM ('salary', 'bonus')`)
  yield* sql.unsafe(`
    CREATE TABLE cycle_incomes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      member_user_id uuid NOT NULL REFERENCES users(id),
      kind income_kind NOT NULL,
      amount_minor bigint NOT NULL,
      currency char(3) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT cycle_incomes_unique UNIQUE (cycle_id, member_user_id, kind)
    )
  `)
  yield* sql.unsafe(`CREATE INDEX cycle_incomes_cycle_id_idx ON cycle_incomes (cycle_id)`)
  yield* sql.unsafe(`ALTER TABLE cycle_incomes ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE cycle_incomes FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY cycle_incomes_household ON cycle_incomes
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON cycle_incomes TO app_role`)

  yield* sql.unsafe(`CREATE TYPE transfer_direction AS ENUM ('to_personal', 'to_household')`)
  yield* sql.unsafe(`
    CREATE TABLE member_transfers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      cycle_id uuid NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      member_user_id uuid NOT NULL REFERENCES users(id),
      direction transfer_direction NOT NULL,
      amount_minor bigint NOT NULL,
      currency char(3) NOT NULL,
      settled_at timestamptz,
      method text,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT member_transfers_amount_positive CHECK (amount_minor > 0)
    )
  `)
  yield* sql.unsafe(`CREATE INDEX member_transfers_cycle_id_idx ON member_transfers (cycle_id)`)
  yield* sql.unsafe(`ALTER TABLE member_transfers ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE member_transfers FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY member_transfers_household ON member_transfers
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON member_transfers TO app_role`)
})
