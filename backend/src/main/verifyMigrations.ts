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

  yield* Effect.promise(() => db.close())

  yield* Effect.sync(() =>
    process.exitCode
      ? console.error("\nverifyMigrations: FAILED")
      : console.log("\nverifyMigrations: all checks passed"),
  )
})

Effect.runPromise(main)
