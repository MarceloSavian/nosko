import { SqlClient } from "@effect/sql"
import { Config, Effect, Redacted } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const password = yield* Config.redacted("APP_DB_PASSWORD")

  yield* sql.unsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_role') THEN
        CREATE ROLE app_role WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
      END IF;
    END $$
  `)
  yield* sql.unsafe(`
    CREATE OR REPLACE FUNCTION pg_temp.set_app_role_password(new_password text) RETURNS void AS $fn$
    BEGIN
      EXECUTE format('ALTER ROLE app_role WITH PASSWORD %L', new_password);
    END;
    $fn$ LANGUAGE plpgsql
  `)
  yield* sql.unsafe("SELECT pg_temp.set_app_role_password($1)", [Redacted.value(password)])
  yield* sql.unsafe(`GRANT USAGE ON SCHEMA public TO app_role`)
})
