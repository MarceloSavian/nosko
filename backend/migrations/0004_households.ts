import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`
    CREATE TABLE households (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      base_currency char(3) NOT NULL DEFAULT 'EUR',
      created_by uuid NOT NULL REFERENCES users(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(`ALTER TABLE households ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE households FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY households_select ON households FOR SELECT
      USING (id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`
    CREATE POLICY households_insert ON households FOR INSERT
      WITH CHECK (created_by = nullif(current_setting('app.user_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`
    CREATE POLICY households_update ON households FOR UPDATE
      USING (id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE ON households TO app_role`)

  yield* sql.unsafe(`
    CREATE TABLE household_settings (
      household_id uuid PRIMARY KEY REFERENCES households(id) ON DELETE CASCADE,
      cycle_anchor_day int NOT NULL DEFAULT 23 CHECK (cycle_anchor_day BETWEEN 1 AND 28),
      locale text NOT NULL DEFAULT 'pt-BR',
      base_currency char(3) NOT NULL DEFAULT 'EUR',
      default_reserve_minor bigint NOT NULL DEFAULT 0,
      box3_allowance_minor bigint NOT NULL DEFAULT 5700000,
      box3_rate numeric(10, 6) NOT NULL DEFAULT 0.0216,
      inflation_rate numeric(10, 6) NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(`ALTER TABLE household_settings ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE household_settings FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY household_settings_household ON household_settings
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON household_settings TO app_role`)

  yield* sql.unsafe(`CREATE TYPE household_member_role AS ENUM ('owner', 'member')`)
  yield* sql.unsafe(`
    CREATE TABLE household_members (
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role household_member_role NOT NULL,
      display_name text,
      joined_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (household_id, user_id)
    )
  `)
  yield* sql.unsafe(`
    CREATE FUNCTION check_household_member_limit() RETURNS trigger AS $$
    BEGIN
      IF (SELECT count(*) FROM household_members WHERE household_id = NEW.household_id) >= 2 THEN
        RAISE EXCEPTION 'household % already has the maximum of two members', NEW.household_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `)
  yield* sql.unsafe(`
    CREATE TRIGGER household_members_limit
      BEFORE INSERT ON household_members
      FOR EACH ROW EXECUTE FUNCTION check_household_member_limit()
  `)
  yield* sql.unsafe(`ALTER TABLE household_members ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE household_members FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY household_members_select ON household_members FOR SELECT
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`
    CREATE POLICY household_members_insert ON household_members FOR INSERT
      WITH CHECK (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        AND user_id = nullif(current_setting('app.user_id', true), '')::uuid
      )
  `)
  yield* sql.unsafe(`
    CREATE POLICY household_members_update ON household_members FOR UPDATE
      USING (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        AND user_id = nullif(current_setting('app.user_id', true), '')::uuid
      )
      WITH CHECK (
        household_id = nullif(current_setting('app.household_id', true), '')::uuid
        AND user_id = nullif(current_setting('app.user_id', true), '')::uuid
      )
  `)
  yield* sql.unsafe(`
    CREATE POLICY household_members_delete ON household_members FOR DELETE
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON household_members TO app_role`)

  yield* sql.unsafe(
    `CREATE TYPE household_invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired')`,
  )
  yield* sql.unsafe(`
    CREATE TABLE household_invitations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      email citext NOT NULL,
      token_hash text NOT NULL,
      invited_by uuid NOT NULL REFERENCES users(id),
      status household_invitation_status NOT NULL DEFAULT 'pending',
      expires_at timestamptz NOT NULL,
      accepted_by uuid REFERENCES users(id),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  yield* sql.unsafe(
    `CREATE INDEX household_invitations_household_id_idx ON household_invitations (household_id)`,
  )
  yield* sql.unsafe(`ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`ALTER TABLE household_invitations FORCE ROW LEVEL SECURITY`)
  yield* sql.unsafe(`
    CREATE POLICY household_invitations_household ON household_invitations
      USING (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
      WITH CHECK (household_id = nullif(current_setting('app.household_id', true), '')::uuid)
  `)
  yield* sql.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON household_invitations TO app_role`)
})
