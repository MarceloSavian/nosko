import { describe, expect, it } from "@jest/globals"
import { Effect } from "effect"
import { TransactionsRepository } from "../../data/protocols/TransactionsRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { TransactionsRepositoryLive } from "./TransactionsRepositoryLive"

const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const accountId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"
const ownerUserId = "8c9e6679-7425-40de-944b-e07fc1f90ae9"

const baseRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90aea",
  household_id: householdId,
  account_id: accountId,
  owner_user_id: ownerUserId,
  visibility: "personal",
  upload_id: null,
  external_id: null,
  booked_at: new Date("2026-01-05"),
  description: "Mercado",
  counterparty: null,
  amount_minor: 5000,
  currency: "BRL",
  direction: "debit",
  category_id: null,
  category_confidence: null,
  is_transfer: false,
  linked_transaction_id: null,
  matched_rule_id: null,
  status: "staged",
  shared_payment_id: null,
  dedup_hash: "hash-1",
  created_at: new Date("2026-01-05"),
}

const newTransactionInput = {
  householdId,
  accountId,
  ownerUserId,
  visibility: "personal" as const,
  uploadId: null,
  externalId: null,
  bookedAt: new Date("2026-01-05"),
  description: "Mercado",
  counterparty: null,
  amountMinor: 5000,
  currency: "BRL",
  direction: "debit" as const,
  categoryId: null,
  categoryConfidence: null,
  isTransfer: false,
  linkedTransactionId: null,
  matchedRuleId: null,
  dedupHash: "hash-1",
}

describe("TransactionsRepositoryLive", () => {
  it("creates many transactions, one insert per row", async () => {
    const { layer, queries } = makeTestSqlClient(() => [baseRow])

    const created = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.createMany([newTransactionInput, newTransactionInput])
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(layer)),
    )

    expect(created).toHaveLength(2)
    expect(queries).toHaveLength(2)
    expect(queries[0]?.sql).toContain('INSERT INTO "transactions"')
  })

  it("finds a transaction by id, and None when missing", async () => {
    const { layer } = makeTestSqlClient(() => [baseRow])
    const found = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.findById(baseRow.id)
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(layer)),
    )
    expect(found._tag).toBe("Some")

    const { layer: emptyLayer } = makeTestSqlClient(() => [])
    const missing = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.findById(baseRow.id)
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(emptyLayer)),
    )
    expect(missing._tag).toBe("None")
  })

  it("returns the set of existing dedup hashes for a household", async () => {
    const { layer, queries } = makeTestSqlClient(() => [
      { dedup_hash: "hash-1" },
      { dedup_hash: "hash-2" },
    ])

    const hashes = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.existingDedupHashes(householdId)
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(layer)),
    )

    expect(hashes).toEqual(new Set(["hash-1", "hash-2"]))
    expect(queries[0]?.sql).toContain('SELECT "dedup_hash" FROM "transactions"')
  })

  it("lists staged transactions for a household", async () => {
    const { layer, queries } = makeTestSqlClient(() => [baseRow])
    const staged = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.listStaged(householdId)
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(layer)),
    )
    expect(staged).toHaveLength(1)
    expect(queries[0]?.sql).toContain("'staged'")
  })

  it("lists transactions by upload id", async () => {
    const { layer, queries } = makeTestSqlClient(() => [baseRow])
    const list = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.listByUpload("upload-1")
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(layer)),
    )
    expect(list).toHaveLength(1)
    expect(queries[0]?.sql).toContain('WHERE "upload_id" = $1')
  })

  it("updates a staged transaction's category", async () => {
    const categoryId = "8c9e6679-7425-40de-944b-e07fc1f90aeb"
    const { layer, queries } = makeTestSqlClient(() => [{ ...baseRow, category_id: categoryId }])
    const updated = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.updateCategory(baseRow.id, categoryId)
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(layer)),
    )
    expect(updated.categoryId).toBe(categoryId)
    expect(queries[0]?.sql).toContain('UPDATE "transactions"')
  })

  it("confirms a transaction", async () => {
    const categoryId = "8c9e6679-7425-40de-944b-e07fc1f90aeb"
    const sharedPaymentId = "8c9e6679-7425-40de-944b-e07fc1f90aec"
    const { layer, queries } = makeTestSqlClient(() => [
      {
        ...baseRow,
        category_id: categoryId,
        status: "confirmed",
        shared_payment_id: sharedPaymentId,
      },
    ])
    const confirmed = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.confirm(baseRow.id, { categoryId, status: "confirmed", sharedPaymentId })
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(layer)),
    )
    expect(confirmed.status).toBe("confirmed")
    expect(confirmed.sharedPaymentId).toBe(sharedPaymentId)
    expect(queries[0]?.sql).toContain('UPDATE "transactions"')
  })

  it("ignores a transaction", async () => {
    const { layer } = makeTestSqlClient(() => [{ ...baseRow, status: "ignored" }])
    const ignored = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.ignore(baseRow.id)
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(layer)),
    )
    expect(ignored.status).toBe("ignored")
  })

  it("links a transfer pair", async () => {
    const { layer, queries } = makeTestSqlClient(() => [])
    await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.linkTransfer(baseRow.id, "other-txn-id")
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(layer)),
    )
    expect(queries[0]?.sql).toContain('UPDATE "transactions"')
  })

  it("finds the last category used for a counterparty, and None when there isn't one", async () => {
    const categoryId = "8c9e6679-7425-40de-944b-e07fc1f90aeb"
    const { layer } = makeTestSqlClient(() => [{ category_id: categoryId }])
    const found = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.lastCategoryForCounterparty(ownerUserId, "personal", "Albert Heijn")
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(layer)),
    )
    expect(found._tag).toBe("Some")

    const { layer: emptyLayer } = makeTestSqlClient(() => [])
    const missing = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* TransactionsRepository
        return yield* repo.lastCategoryForCounterparty(ownerUserId, "personal", "Unknown")
      }).pipe(Effect.provide(TransactionsRepositoryLive), Effect.provide(emptyLayer)),
    )
    expect(missing._tag).toBe("None")
  })
})
