import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`CREATE TYPE statement_format AS ENUM ('csv', 'pdf')`)
  yield* sql.unsafe(
    `CREATE TYPE statement_upload_status AS ENUM ('uploaded', 'parsing', 'parsed', 'failed')`,
  )
  yield* sql.unsafe(`CREATE TYPE transaction_direction AS ENUM ('debit', 'credit')`)
  yield* sql.unsafe(
    `CREATE TYPE transaction_status AS ENUM ('staged', 'confirmed', 'ignored', 'duplicate')`,
  )

  yield* sql.unsafe(`
    CREATE TABLE statement_uploads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      account_id uuid NOT NULL REFERENCES accounts(id),
      uploaded_by uuid NOT NULL REFERENCES users(id),
      file_key text NOT NULL,
      original_filename text NOT NULL,
      format statement_format NOT NULL,
      period_start date,
      period_end date,
      status statement_upload_status NOT NULL DEFAULT 'uploaded',
      error text,
      uploaded_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(`ALTER TABLE statement_uploads ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE statement_uploads FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY statement_uploads_household ON statement_uploads
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE ON statement_uploads TO app_role`)

  yield* sql.unsafe(`
    CREATE TABLE transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      account_id uuid NOT NULL REFERENCES accounts(id),
      owner_user_id uuid NOT NULL REFERENCES users(id),
      visibility account_visibility NOT NULL,
      upload_id uuid REFERENCES statement_uploads(id),
      external_id text,
      booked_at date NOT NULL,
      description text NOT NULL,
      counterparty text,
      amount_minor bigint NOT NULL,
      currency char(3) NOT NULL,
      direction transaction_direction NOT NULL,
      category_id uuid REFERENCES categories(id),
      category_confidence numeric(4, 3),
      is_transfer boolean NOT NULL DEFAULT false,
      linked_transaction_id uuid REFERENCES transactions(id),
      matched_rule_id uuid REFERENCES recurring_rules(id),
      status transaction_status NOT NULL DEFAULT 'staged',
      shared_payment_id uuid REFERENCES shared_payments(id),
      dedup_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT transactions_household_dedup_hash_unique UNIQUE (household_id, dedup_hash)
    )
  `)
  yield* sql.unsafe(
    `CREATE INDEX transactions_household_account_booked_idx ON transactions (household_id, account_id, booked_at)`,
  )
  yield* sql.unsafe(
    `CREATE INDEX transactions_owner_visibility_idx ON transactions (owner_user_id, visibility)`,
  )
  yield* sql.unsafe(`ALTER TABLE transactions ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE transactions FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY transactions_select ON transactions FOR SELECT
      USING (
        (visibility = 'shared' AND household_id = nullif(current_setting('app.household_id', true), '')::uuid)
        OR (visibility = 'personal' AND owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      )
  `)
  yield* sql.unsafe(`
    CREATE POLICY transactions_insert ON transactions FOR INSERT
      WITH CHECK (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        AND (visibility = 'shared' OR owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      )
  `)
  yield* sql.unsafe(`
    CREATE POLICY transactions_update ON transactions FOR UPDATE
      USING (
        (visibility = 'shared' AND household_id = nullif(current_setting('app.household_id', true), '')::uuid)
        OR owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid
      )
      WITH CHECK (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        AND (visibility = 'shared' OR owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      )
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE ON transactions TO app_role`)
})
