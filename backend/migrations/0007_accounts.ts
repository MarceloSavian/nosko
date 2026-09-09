import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`CREATE TYPE account_visibility AS ENUM ('personal', 'shared')`)
  yield* sql.unsafe(`CREATE TYPE account_ownership AS ENUM ('sole', 'joint')`)
  yield* sql.unsafe(
    `CREATE TYPE account_institution AS ENUM ('ing', 'revolut', 'amex', 'nubank', 'c6', 'abn', 'other')`,
  )
  yield* sql.unsafe(
    `CREATE TYPE account_type AS ENUM ('checking', 'credit_card', 'savings', 'brokerage', 'investment', 'vault')`,
  )
  yield* sql.unsafe(`CREATE TYPE account_source AS ENUM ('manual', 'file_import')`)

  yield* sql.unsafe(`
    CREATE TABLE accounts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      owner_user_id uuid NOT NULL REFERENCES users(id),
      co_owner_user_id uuid REFERENCES users(id),
      ownership account_ownership NOT NULL DEFAULT 'sole',
      visibility account_visibility NOT NULL DEFAULT 'personal',
      institution account_institution NOT NULL,
      nickname text NOT NULL,
      type account_type NOT NULL,
      currency char(3) NOT NULL,
      masked_id text,
      balance_minor bigint,
      purpose text,
      statement_close_day int,
      credit_limit_minor bigint,
      autopay_account_id uuid REFERENCES accounts(id),
      source account_source NOT NULL DEFAULT 'manual',
      last_import_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT accounts_joint_is_shared CHECK (ownership = 'sole' OR visibility = 'shared'),
      CONSTRAINT accounts_co_owner_distinct CHECK (co_owner_user_id IS NULL OR co_owner_user_id <> owner_user_id),
      CONSTRAINT accounts_household_masked_id_unique UNIQUE (household_id, masked_id)
    )
  `)
  yield* sql.unsafe(
    `CREATE INDEX accounts_household_visibility_idx ON accounts (household_id, visibility)`,
  )
  yield* sql.unsafe(`CREATE INDEX accounts_owner_user_id_idx ON accounts (owner_user_id)`)
  yield* sql.unsafe(`CREATE INDEX accounts_co_owner_user_id_idx ON accounts (co_owner_user_id)`)
  yield* sql.unsafe(`ALTER TABLE accounts ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE accounts FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY accounts_select ON accounts FOR SELECT
      USING (
        (visibility = 'shared' AND household_id = nullif(current_setting('app.household_id', true), '')::uuid)
        OR (visibility = 'personal' AND owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      )
  `)
  yield* sql.unsafe(`
    CREATE POLICY accounts_insert ON accounts FOR INSERT
      WITH CHECK (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        AND owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid
      )
  `)
  yield* sql.unsafe(`
    CREATE POLICY accounts_update ON accounts FOR UPDATE
      USING (
        (visibility = 'shared' AND household_id = nullif(current_setting('app.household_id', true), '')::uuid)
        OR owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid
        OR co_owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid
      )
      WITH CHECK (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        AND (visibility = 'shared' OR owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      )
  `)
  yield* sql.unsafe(`
    CREATE POLICY accounts_delete ON accounts FOR DELETE
      USING (
        (visibility = 'shared' AND household_id = nullif(current_setting('app.household_id', true), '')::uuid)
        OR owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid
        OR co_owner_user_id = nullif(current_setting('app.user_id', true), '')::uuid
      )
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO app_role`)
})
