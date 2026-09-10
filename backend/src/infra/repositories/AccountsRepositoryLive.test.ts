import { describe, expect, it } from "@jest/globals"
import { Effect, Option } from "effect"
import { AccountsRepository } from "../../data/protocols/AccountsRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AccountsRepositoryLive } from "./AccountsRepositoryLive"

const now = new Date("2026-01-01T00:00:00.000Z")

const accountRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  household_id: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  owner_user_id: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
  co_owner_user_id: null,
  ownership: "sole",
  visibility: "personal",
  institution: "revolut",
  nickname: "Revolut EUR",
  type: "checking",
  currency: "EUR",
  masked_id: null,
  balance_minor: null,
  purpose: null,
  statement_close_day: null,
  credit_limit_minor: null,
  autopay_account_id: null,
  source: "manual",
  last_import_at: null,
  created_at: now,
  updated_at: now,
}

describe("AccountsRepositoryLive", () => {
  it("creates an account", async () => {
    const { layer, queries } = makeTestSqlClient(() => [accountRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AccountsRepository
        return yield* repo.create({
          householdId: accountRow.household_id,
          ownerUserId: accountRow.owner_user_id,
          ownership: "sole",
          visibility: "personal",
          institution: "revolut",
          nickname: "Revolut EUR",
          type: "checking",
          currency: "EUR",
          maskedId: null,
          balanceMinor: null,
          purpose: null,
          statementCloseDay: null,
          creditLimitMinor: null,
          autopayAccountId: null,
        })
      }).pipe(Effect.provide(AccountsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.nickname).toBe("Revolut EUR")
    expect(queries[0]?.sql.startsWith('INSERT INTO "accounts" (')).toBe(true)
    expect(queries[0]?.sql).toContain('"credit_limit_minor"')
    expect(queries[0]?.sql.endsWith(") RETURNING *")).toBe(true)
  })

  it("finds an account by id", async () => {
    const { layer, queries } = makeTestSqlClient(() => [accountRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AccountsRepository
        return yield* repo.findById(accountRow.id)
      }).pipe(Effect.provide(AccountsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toBe('SELECT * FROM "accounts" WHERE id = $1')
  })

  it("returns none when no account matches the id", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AccountsRepository
        return yield* repo.findById("missing")
      }).pipe(Effect.provide(AccountsRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isNone(decoded)).toBe(true)
  })

  it("lists accounts visible to the current RLS scope", async () => {
    const { layer, queries } = makeTestSqlClient(() => [accountRow, accountRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AccountsRepository
        return yield* repo.list()
      }).pipe(Effect.provide(AccountsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded).toHaveLength(2)
    expect(queries[0]?.sql).toBe('SELECT * FROM "accounts" ORDER BY "created_at"')
  })

  it("updates an account's editable fields", async () => {
    const { layer, queries } = makeTestSqlClient(() => [
      { ...accountRow, nickname: "Revolut Savings", purpose: "Emergency fund" },
    ])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AccountsRepository
        return yield* repo.update(accountRow.id, {
          nickname: "Revolut Savings",
          maskedId: null,
          balanceMinor: null,
          purpose: "Emergency fund",
          statementCloseDay: null,
          creditLimitMinor: null,
          autopayAccountId: null,
        })
      }).pipe(Effect.provide(AccountsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.nickname).toBe("Revolut Savings")
    expect(queries[0]?.sql).toContain('SET "nickname" = $1')
    expect(queries[0]?.sql.endsWith("WHERE id = $9 RETURNING *")).toBe(true)
  })

  it("removes an account", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])

    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AccountsRepository
        return yield* repo.remove(accountRow.id)
      }).pipe(Effect.provide(AccountsRepositoryLive), Effect.provide(layer)),
    )

    expect(queries[0]?.sql).toBe('DELETE FROM "accounts" WHERE id = $1')
    expect(queries[0]?.params).toEqual([accountRow.id])
  })

  it("sets an account's visibility", async () => {
    const { layer, queries } = makeTestSqlClient(() => [{ ...accountRow, visibility: "shared" }])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AccountsRepository
        return yield* repo.setVisibility(accountRow.id, "shared")
      }).pipe(Effect.provide(AccountsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.visibility).toBe("shared")
    expect(queries[0]?.sql).toBe(
      'UPDATE "accounts" SET "visibility" = $1, "updated_at" = $2 WHERE id = $3 RETURNING *',
    )
    expect(queries[0]?.params?.[0]).toBe("shared")
    expect(queries[0]?.params?.[2]).toBe(accountRow.id)
  })

  it("sets an account's co-owner", async () => {
    const coOwnerId = "8c9e6679-7425-40de-944b-e07fc1f90aea"
    const { layer, queries } = makeTestSqlClient(() => [
      { ...accountRow, co_owner_user_id: coOwnerId },
    ])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* AccountsRepository
        return yield* repo.setCoOwner(accountRow.id, coOwnerId)
      }).pipe(Effect.provide(AccountsRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.coOwnerUserId).toBe(coOwnerId)
    expect(queries[0]?.sql).toBe(
      'UPDATE "accounts" SET "co_owner_user_id" = $1, "updated_at" = $2 WHERE id = $3 RETURNING *',
    )
  })
})
