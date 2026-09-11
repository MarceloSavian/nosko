import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import { SqlClient } from "@effect/sql"
import { PGlite } from "@electric-sql/pglite"
import { citext } from "@electric-sql/pglite/contrib/citext"
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto"
import { ConfigProvider, Effect, Layer } from "effect"

const MIGRATIONS_DIR = new URL("../../migrations", import.meta.url).pathname

const db = new PGlite({ extensions: { citext, pgcrypto } })

const applyMigrations = Effect.gen(function* () {
  const configProvider = ConfigProvider.fromMap(
    new Map([["APP_DB_PASSWORD", "verify-migrations-password"]]),
  )
  const fakeSqlClient = {
    unsafe: (sql: string, params?: Array<unknown>) => Effect.promise(() => db.query(sql, params)),
  }
  const layer = Layer.succeed(SqlClient.SqlClient, fakeSqlClient as unknown as SqlClient.SqlClient)

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d+_.*\.ts$/.test(file))
    .sort()

  for (const file of files) {
    const mod = yield* Effect.promise(() => import(`${MIGRATIONS_DIR}/${file}`))
    yield* (mod.default as Effect.Effect<void, never, SqlClient.SqlClient>).pipe(
      Effect.provide(layer),
      Effect.withConfigProvider(configProvider),
    )
    yield* Effect.sync(() => console.log(`applied ${file}`))
  }
})

const check = (label: string, fn: () => Promise<void>) =>
  Effect.tryPromise(fn).pipe(
    Effect.tap(() => Effect.sync(() => console.log(`OK   ${label}`))),
    Effect.tapError((error) =>
      Effect.sync(() => {
        console.error(`FAIL ${label}`)
        console.error(error)
        process.exitCode = 1
      }),
    ),
    Effect.ignore,
  )

const main = Effect.gen(function* () {
  yield* applyMigrations

  yield* check("app_role is created without superuser or bypassrls", async () => {
    const res = await db.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
      "select rolsuper, rolbypassrls from pg_roles where rolname = 'app_role'",
    )
    assert.deepEqual(res.rows, [{ rolsuper: false, rolbypassrls: false }])
  })

  yield* check("app_role cannot alter table security settings", async () => {
    await db.query("set role app_role")
    await assert.rejects(
      db.query("alter table accounts disable row level security"),
      /must be owner/,
    )
    await db.query("reset role")
  })

  yield* check("a personal account is never visible to the partner", async () => {
    const marcelo = "a0000000-0000-0000-0000-000000000001"
    const gabriele = "a0000000-0000-0000-0000-000000000002"
    const household = "a0000000-0000-0000-0000-000000000003"
    const account = "a0000000-0000-0000-0000-000000000004"

    await db.query("set role app_role")
    await db.query(
      "insert into users (id, email, password_hash, name) values ($1, $2, 'hash', 'Marcelo')",
      [marcelo, "marcelo-privacy-check@example.com"],
    )
    await db.query(
      "insert into users (id, email, password_hash, name) values ($1, $2, 'hash', 'Gabriele')",
      [gabriele, "gabriele-privacy-check@example.com"],
    )
    await db.query("select set_config('app.user_id', $1, false)", [marcelo])
    await db.query(
      "insert into households (id, name, base_currency, created_by) values ($1, 'Casa', 'EUR', $2)",
      [household, marcelo],
    )
    await db.query("select set_config('app.household_id', $1, false)", [household])
    await db.query("insert into household_settings (household_id) values ($1)", [household])
    await db.query(
      "insert into household_members (household_id, user_id, role) values ($1, $2, 'owner')",
      [household, marcelo],
    )
    await db.query("select set_config('app.user_id', $1, false)", [gabriele])
    await db.query(
      "insert into household_members (household_id, user_id, role) values ($1, $2, 'member')",
      [household, gabriele],
    )
    await db.query("select set_config('app.user_id', $1, false)", [marcelo])
    await db.query(
      `insert into accounts
         (id, household_id, owner_user_id, visibility, institution, nickname, type, currency)
       values ($1, $2, $3, 'personal', 'revolut', 'Revolut EUR', 'checking', 'EUR')`,
      [account, household, marcelo],
    )

    const owner = await db.query("select id from accounts where id = $1", [account])
    assert.equal(owner.rows.length, 1, "the owner must see their own account")

    await db.query("select set_config('app.user_id', $1, false)", [gabriele])
    const partner = await db.query("select id from accounts where id = $1", [account])
    assert.equal(partner.rows.length, 0, "the partner must never see it")

    await db.query("select set_config('app.user_id', '', false)")
    const noScope = await db.query("select id from accounts where id = $1", [account])
    assert.equal(noScope.rows.length, 0, "a reset scope must not fall back to visible")

    await db.query("reset role")
  })

  yield* check(
    "a joint account is visible to both owners; a third member is rejected",
    async () => {
      const marcelo = "b0000000-0000-0000-0000-000000000001"
      const gabriele = "b0000000-0000-0000-0000-000000000002"
      const third = "b0000000-0000-0000-0000-000000000003"
      const household = "b0000000-0000-0000-0000-000000000004"
      const account = "b0000000-0000-0000-0000-000000000005"

      await db.query("set role app_role")
      for (const [id, email] of [
        [marcelo, "marcelo-joint-check@example.com"],
        [gabriele, "gabriele-joint-check@example.com"],
        [third, "third-joint-check@example.com"],
      ]) {
        await db.query(
          "insert into users (id, email, password_hash, name) values ($1, $2, 'hash', 'X')",
          [id, email],
        )
      }
      await db.query("select set_config('app.user_id', $1, false)", [marcelo])
      await db.query(
        "insert into households (id, name, base_currency, created_by) values ($1, 'Casa', 'EUR', $2)",
        [household, marcelo],
      )
      await db.query("select set_config('app.household_id', $1, false)", [household])
      await db.query("insert into household_settings (household_id) values ($1)", [household])
      await db.query(
        "insert into household_members (household_id, user_id, role) values ($1, $2, 'owner')",
        [household, marcelo],
      )
      await db.query(
        `insert into accounts
         (id, household_id, owner_user_id, co_owner_user_id, ownership, visibility, institution, nickname, type, currency)
       values ($1, $2, $3, null, 'joint', 'shared', 'ing', 'ING Conjunta', 'checking', 'EUR')`,
        [account, household, marcelo],
      )

      await db.query("update accounts set co_owner_user_id = $1 where id = $2", [gabriele, account])
      await db.query("select set_config('app.user_id', $1, false)", [gabriele])
      const asCoOwner = await db.query("select id from accounts where id = $1", [account])
      assert.equal(asCoOwner.rows.length, 1, "the co-owner must see the joint account")

      await db.query(
        "insert into household_members (household_id, user_id, role) values ($1, $2, 'member')",
        [household, gabriele],
      )
      await assert.rejects(
        db.query(
          "insert into household_members (household_id, user_id, role) values ($1, $2, 'member')",
          [household, third],
        ),
        /maximum of two members/,
      )

      await db.query("reset role")
    },
  )

  yield* check(
    "a member can find their own household membership without app.household_id set",
    async () => {
      const marcelo = "c0000000-0000-0000-0000-000000000001"
      const gabriele = "c0000000-0000-0000-0000-000000000002"
      const household = "c0000000-0000-0000-0000-000000000003"

      await db.query("set role app_role")
      await db.query(
        "insert into users (id, email, password_hash, name) values ($1, $2, 'hash', 'Marcelo')",
        [marcelo, "marcelo-membership-check@example.com"],
      )
      await db.query(
        "insert into users (id, email, password_hash, name) values ($1, $2, 'hash', 'Gabriele')",
        [gabriele, "gabriele-membership-check@example.com"],
      )
      await db.query("select set_config('app.user_id', $1, false)", [marcelo])
      await db.query(
        "insert into households (id, name, base_currency, created_by) values ($1, 'Casa', 'EUR', $2)",
        [household, marcelo],
      )
      await db.query("select set_config('app.household_id', $1, false)", [household])
      await db.query("insert into household_settings (household_id) values ($1)", [household])
      await db.query(
        "insert into household_members (household_id, user_id, role) values ($1, $2, 'owner')",
        [household, marcelo],
      )

      await db.query("select set_config('app.household_id', '', false)")
      const ownMembership = await db.query(
        "select household_id from household_members where user_id = $1",
        [marcelo],
      )
      assert.equal(ownMembership.rows.length, 1, "a member must find their own membership")

      await db.query("select set_config('app.user_id', $1, false)", [gabriele])
      const strangerLookup = await db.query(
        "select household_id from household_members where user_id = $1",
        [marcelo],
      )
      assert.equal(strangerLookup.rows.length, 0, "a non-member must not see someone else's row")

      await db.query("reset role")
    },
  )

  yield* check(
    "an invited user can read and accept their invitation before joining the household",
    async () => {
      const marcelo = "d0000000-0000-0000-0000-000000000001"
      const gabriele = "d0000000-0000-0000-0000-000000000002"
      const household = "d0000000-0000-0000-0000-000000000003"
      const invitation = "d0000000-0000-0000-0000-000000000004"
      const gabrieleEmail = "gabriele-accept-check@example.com"

      await db.query("set role app_role")
      await db.query(
        "insert into users (id, email, password_hash, name) values ($1, $2, 'hash', 'Marcelo')",
        [marcelo, "marcelo-accept-check@example.com"],
      )
      await db.query(
        "insert into users (id, email, password_hash, name) values ($1, $2, 'hash', 'Gabriele')",
        [gabriele, gabrieleEmail],
      )
      await db.query("select set_config('app.user_id', $1, false)", [marcelo])
      await db.query(
        "insert into households (id, name, base_currency, created_by) values ($1, 'Casa', 'EUR', $2)",
        [household, marcelo],
      )
      await db.query("select set_config('app.household_id', $1, false)", [household])
      await db.query("insert into household_settings (household_id) values ($1)", [household])
      await db.query(
        "insert into household_members (household_id, user_id, role) values ($1, $2, 'owner')",
        [household, marcelo],
      )
      await db.query(
        `insert into household_invitations
           (id, household_id, email, token_hash, invited_by, expires_at)
         values ($1, $2, $3, 'hash', $4, now() + interval '7 days')`,
        [invitation, household, gabrieleEmail, marcelo],
      )

      await db.query("select set_config('app.user_id', $1, false)", [gabriele])
      await db.query("select set_config('app.household_id', '', false)")
      const found = await db.query("select id from household_invitations where id = $1", [
        invitation,
      ])
      assert.equal(found.rows.length, 1, "the invitee must be able to read their own invitation")

      await db.query(
        "insert into household_members (household_id, user_id, role) values ($1, $2, 'member')",
        [household, gabriele],
      )
      await db.query(
        "update household_invitations set status = 'accepted', accepted_by = $1 where id = $2",
        [gabriele, invitation],
      )
      const accepted = await db.query<{ status: string }>(
        "select status from household_invitations where id = $1",
        [invitation],
      )
      assert.equal(accepted.rows[0]?.status, "accepted")

      await db.query("reset role")
    },
  )

  yield* check(
    "a cycle, its fixed bill, its recurring rule, and its shared payment are never visible to a different household",
    async () => {
      const ownerA = "e0000000-0000-0000-0000-000000000001"
      const ownerB = "e0000000-0000-0000-0000-000000000002"
      const householdA = "e0000000-0000-0000-0000-000000000003"
      const householdB = "e0000000-0000-0000-0000-000000000004"
      const cycle = "e0000000-0000-0000-0000-000000000005"
      const rule = "e0000000-0000-0000-0000-000000000006"
      const bill = "e0000000-0000-0000-0000-000000000007"
      const cap = "e0000000-0000-0000-0000-000000000008"
      const category = "e0000000-0000-0000-0000-000000000009"
      const account = "e0000000-0000-0000-0000-00000000000a"
      const payment = "e0000000-0000-0000-0000-00000000000b"

      await db.query("set role app_role")
      for (const [id, email] of [
        [ownerA, "owner-a-cycle-check@example.com"],
        [ownerB, "owner-b-cycle-check@example.com"],
      ]) {
        await db.query(
          "insert into users (id, email, password_hash, name) values ($1, $2, 'hash', 'X')",
          [id, email],
        )
      }

      await db.query("select set_config('app.user_id', $1, false)", [ownerA])
      await db.query(
        "insert into households (id, name, base_currency, created_by) values ($1, 'Casa A', 'EUR', $2)",
        [householdA, ownerA],
      )
      await db.query("select set_config('app.household_id', $1, false)", [householdA])
      await db.query("insert into household_settings (household_id) values ($1)", [householdA])
      await db.query(
        "insert into household_members (household_id, user_id, role) values ($1, $2, 'owner')",
        [householdA, ownerA],
      )
      await db.query(
        "insert into categories (id, household_id, scope, name) values ($1, $2, 'household', 'Casa')",
        [category, householdA],
      )
      await db.query(
        `insert into cycles (id, household_id, cycle_key, start_date, end_date)
         values ($1, $2, '2026-01', '2025-12-23', '2026-01-22')`,
        [cycle, householdA],
      )
      await db.query(
        `insert into recurring_rules
           (id, household_id, match_type, matcher, cadence, is_fixed_bill, source)
         values ($1, $2, 'vendor_exact', 'Aluguel', 'monthly', true, 'user_defined')`,
        [rule, householdA],
      )
      await db.query(
        `insert into fixed_bills (id, cycle_id, household_id, recurring_rule_id, label, amount_minor, currency)
         values ($1, $2, $3, $4, 'Aluguel', 150000, 'EUR')`,
        [bill, cycle, householdA, rule],
      )
      await db.query(
        "insert into category_caps (id, household_id, cycle_id, category_id, cap_minor) values ($1, $2, $3, $4, 40000)",
        [cap, householdA, cycle, category],
      )
      await db.query(
        `insert into accounts
           (id, household_id, owner_user_id, ownership, visibility, institution, nickname, type, currency)
         values ($1, $2, $3, 'joint', 'shared', 'ing', 'ING Conjunta', 'checking', 'EUR')`,
        [account, householdA, ownerA],
      )
      await db.query(
        `insert into shared_payments
           (id, household_id, cycle_id, account_id, booked_at, description, amount_minor, currency, amount_base_minor, category_id, created_by)
         values ($1, $2, $3, $4, '2026-01-05', 'Mercado', 10000, 'EUR', 10000, $5, $6)`,
        [payment, householdA, cycle, account, category, ownerA],
      )

      await db.query("select set_config('app.user_id', $1, false)", [ownerB])
      await db.query(
        "insert into households (id, name, base_currency, created_by) values ($1, 'Casa B', 'EUR', $2)",
        [householdB, ownerB],
      )
      await db.query("select set_config('app.household_id', $1, false)", [householdB])
      await db.query("insert into household_settings (household_id) values ($1)", [householdB])
      await db.query(
        "insert into household_members (household_id, user_id, role) values ($1, $2, 'owner')",
        [householdB, ownerB],
      )

      const cyclesFromB = await db.query("select id from cycles where id = $1", [cycle])
      assert.equal(cyclesFromB.rows.length, 0, "household B must not see household A's cycle")
      const billsFromB = await db.query("select id from fixed_bills where id = $1", [bill])
      assert.equal(billsFromB.rows.length, 0, "household B must not see household A's fixed bill")
      const rulesFromB = await db.query("select id from recurring_rules where id = $1", [rule])
      assert.equal(rulesFromB.rows.length, 0, "household B must not see household A's rule")
      const capsFromB = await db.query("select id from category_caps where id = $1", [cap])
      assert.equal(capsFromB.rows.length, 0, "household B must not see household A's category cap")
      const paymentsFromB = await db.query("select id from shared_payments where id = $1", [
        payment,
      ])
      assert.equal(
        paymentsFromB.rows.length,
        0,
        "household B must not see household A's shared payment",
      )

      await db.query("select set_config('app.household_id', $1, false)", [householdA])
      const cyclesFromA = await db.query("select id from cycles where id = $1", [cycle])
      assert.equal(cyclesFromA.rows.length, 1, "household A must still see its own cycle")

      await db.query("reset role")
    },
  )

  yield* check(
    "a personal transaction is never visible to the partner, but a shared one is visible to both",
    async () => {
      const marcelo = "f0000000-0000-0000-0000-000000000001"
      const gabriele = "f0000000-0000-0000-0000-000000000002"
      const household = "f0000000-0000-0000-0000-000000000003"
      const personalAccount = "f0000000-0000-0000-0000-000000000004"
      const sharedAccount = "f0000000-0000-0000-0000-000000000005"
      const personalTxn = "f0000000-0000-0000-0000-000000000006"
      const sharedTxn = "f0000000-0000-0000-0000-000000000007"

      await db.query("set role app_role")
      await db.query(
        "insert into users (id, email, password_hash, name) values ($1, $2, 'hash', 'Marcelo')",
        [marcelo, "marcelo-txn-check@example.com"],
      )
      await db.query(
        "insert into users (id, email, password_hash, name) values ($1, $2, 'hash', 'Gabriele')",
        [gabriele, "gabriele-txn-check@example.com"],
      )
      await db.query("select set_config('app.user_id', $1, false)", [marcelo])
      await db.query(
        "insert into households (id, name, base_currency, created_by) values ($1, 'Casa', 'EUR', $2)",
        [household, marcelo],
      )
      await db.query("select set_config('app.household_id', $1, false)", [household])
      await db.query("insert into household_settings (household_id) values ($1)", [household])
      await db.query(
        "insert into household_members (household_id, user_id, role) values ($1, $2, 'owner')",
        [household, marcelo],
      )
      await db.query("select set_config('app.user_id', $1, false)", [gabriele])
      await db.query(
        "insert into household_members (household_id, user_id, role) values ($1, $2, 'member')",
        [household, gabriele],
      )
      await db.query("select set_config('app.user_id', $1, false)", [marcelo])
      await db.query(
        `insert into accounts
           (id, household_id, owner_user_id, visibility, institution, nickname, type, currency)
         values ($1, $2, $3, 'personal', 'nubank', 'Nubank', 'checking', 'BRL')`,
        [personalAccount, household, marcelo],
      )
      await db.query(
        `insert into accounts
           (id, household_id, owner_user_id, ownership, visibility, institution, nickname, type, currency)
         values ($1, $2, $3, 'joint', 'shared', 'ing', 'ING Conjunta', 'checking', 'EUR')`,
        [sharedAccount, household, marcelo],
      )
      await db.query(
        `insert into transactions
           (id, household_id, account_id, owner_user_id, visibility, booked_at, description, amount_minor, currency, direction, dedup_hash)
         values ($1, $2, $3, $4, 'personal', '2026-01-05', 'Mercado', 5000, 'BRL', 'debit', 'hash-personal')`,
        [personalTxn, household, personalAccount, marcelo],
      )
      await db.query(
        `insert into transactions
           (id, household_id, account_id, owner_user_id, visibility, booked_at, description, amount_minor, currency, direction, dedup_hash)
         values ($1, $2, $3, $4, 'shared', '2026-01-05', 'Aluguel', 150000, 'EUR', 'debit', 'hash-shared')`,
        [sharedTxn, household, sharedAccount, marcelo],
      )

      const ownerSeesPersonal = await db.query("select id from transactions where id = $1", [
        personalTxn,
      ])
      assert.equal(ownerSeesPersonal.rows.length, 1, "the owner must see their own transaction")

      await db.query("select set_config('app.user_id', $1, false)", [gabriele])
      const partnerSeesPersonal = await db.query("select id from transactions where id = $1", [
        personalTxn,
      ])
      assert.equal(partnerSeesPersonal.rows.length, 0, "the partner must never see it")

      const partnerSeesShared = await db.query("select id from transactions where id = $1", [
        sharedTxn,
      ])
      assert.equal(partnerSeesShared.rows.length, 1, "the partner must see the shared transaction")

      await db.query("reset role")
    },
  )

  yield* Effect.promise(() => db.close())

  yield* Effect.sync(() =>
    process.exitCode
      ? console.error("\nverifyMigrations: FAILED")
      : console.log("\nverifyMigrations: all checks passed"),
  )
})

Effect.runPromise(main)
