import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email citext NOT NULL UNIQUE,
      password_hash text NOT NULL,
      name text NOT NULL,
      preferred_locale text NOT NULL DEFAULT 'pt-BR',
      email_verified boolean NOT NULL DEFAULT false,
      mfa_enabled boolean NOT NULL DEFAULT false,
      mfa_secret text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON users TO app_role`)

  yield* sql.unsafe(
    `CREATE TYPE auth_token_type AS ENUM ('email_verify', 'password_reset', 'mfa_otp')`,
  )

  yield* sql.unsafe(`
    CREATE TABLE auth_tokens (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type auth_token_type NOT NULL,
      token_hash text NOT NULL,
      expires_at timestamptz NOT NULL,
      consumed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(`CREATE INDEX auth_tokens_user_id_idx ON auth_tokens (user_id)`)
  yield* sql.unsafe(`ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE auth_tokens FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY auth_tokens_owner ON auth_tokens
      USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON auth_tokens TO app_role`)

  yield* sql.unsafe(`
    CREATE TABLE user_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_hash text NOT NULL,
      device_label text,
      mfa_trusted_until timestamptz,
      expires_at timestamptz NOT NULL,
      revoked_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(`CREATE INDEX user_sessions_user_id_idx ON user_sessions (user_id)`)
  yield* sql.unsafe(`ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE user_sessions FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY user_sessions_owner ON user_sessions
      USING (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
      WITH CHECK (user_id = nullif(current_setting('app.user_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO app_role`)
})
