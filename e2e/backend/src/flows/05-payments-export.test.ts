import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import { DateTime, Either } from "effect"
import { disposeApiRuntime, rpc, rpcEither, withSession } from "../client/apiClient.ts"
import { exportCsv } from "../client/httpApi.ts"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../db.ts"
import { seedHouseholdCategory } from "../helpers/categories.ts"
import { cleanupTestData } from "../helpers/cleanup.ts"
import { type Couple, setupCouple } from "../support/fixtures.ts"

describe("shared payments, spending summary and CSV export", () => {
  let db: AdminDb
  let couple: Couple
  let categoryId: string
  let sharedAccountId: string
  let personalAccountId: string
  let cycleId: string
  let cycleStart: DateTime.Utc

  before(async () => {
    db = await connectAdminDb()
    couple = await setupCouple(db)
    categoryId = await seedHouseholdCategory(db, couple.householdId, "E2E Dining")

    const shared = await rpc((client) =>
      client.accounts.create(
        {
          ownership: "joint",
          visibility: "shared",
          institution: "ing",
          nickname: "Joint Spending",
          type: "checking",
          currency: "EUR",
          maskedId: null,
          balanceMinor: 200_00,
          purpose: null,
          statementCloseDay: null,
          creditLimitMinor: null,
          autopayAccountId: null,
        },
        withSession(couple.owner.session),
      ),
    )
    sharedAccountId = shared.id

    const personal = await rpc((client) =>
      client.accounts.create(
        {
          ownership: "sole",
          visibility: "personal",
          institution: "revolut",
          nickname: "Owner Personal",
          type: "checking",
          currency: "EUR",
          maskedId: null,
          balanceMinor: 10_00,
          purpose: null,
          statementCloseDay: null,
          creditLimitMinor: null,
          autopayAccountId: null,
        },
        withSession(couple.owner.session),
      ),
    )
    personalAccountId = personal.id

    const cycle = await rpc((client) =>
      client.cycles.create(
        {
          title: "Payments Cycle",
          reserveMinor: 0,
          estimateMinor: null,
          seedOpeningBalanceMinor: null,
        },
        withSession(couple.owner.session),
      ),
    )
    cycleId = cycle.id
    cycleStart = cycle.startDate
  })

  after(async () => {
    await cleanupTestData(db, {
      householdIds: [couple.householdId],
      userIds: couple.cleanupUserIds,
    })
    await closeAdminDb(db)
    await disposeApiRuntime()
  })

  it("rejects a payment against a personal account", async () => {
    const result = await rpcEither((client) =>
      client.payments.create(
        {
          accountId: personalAccountId,
          bookedAt: cycleStart,
          description: "Should fail",
          counterparty: null,
          amountMinor: 10_00,
          currency: "EUR",
          categoryId,
        },
        withSession(couple.owner.session),
      ),
    )
    assert.ok(Either.isLeft(result))
    assert.equal(result.left._tag, "SharedAccountRequired")
  })

  it("rejects a payment dated outside any cycle", async () => {
    const farFuture = DateTime.unsafeFromDate(new Date("2099-01-01T00:00:00.000Z"))
    const result = await rpcEither((client) =>
      client.payments.create(
        {
          accountId: sharedAccountId,
          bookedAt: farFuture,
          description: "Should fail",
          counterparty: null,
          amountMinor: 10_00,
          currency: "EUR",
          categoryId,
        },
        withSession(couple.owner.session),
      ),
    )
    assert.ok(Either.isLeft(result))
    assert.equal(result.left._tag, "NoCycleForDate")
  })

  it("records shared payments, lists them, updates one, and summarizes by category", async () => {
    const groceries = await rpc((client) =>
      client.payments.create(
        {
          accountId: sharedAccountId,
          bookedAt: cycleStart,
          description: "E2E Supermarket",
          counterparty: "Supermarket Inc",
          amountMinor: 45_50,
          currency: "EUR",
          categoryId,
        },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(groceries.amountBaseMinor, 45_50)

    const dinner = await rpc((client) =>
      client.payments.create(
        {
          accountId: sharedAccountId,
          bookedAt: cycleStart,
          description: "E2E Restaurant",
          counterparty: "Restaurant Inc",
          amountMinor: 30_00,
          currency: "EUR",
          categoryId,
        },
        withSession(couple.partner.session),
      ),
    )

    const listed = await rpc((client) =>
      client.payments.list({ cycleId }, withSession(couple.owner.session)),
    )
    assert.equal(listed.length, 2)

    const updated = await rpc((client) =>
      client.payments.update(
        {
          id: dinner.id,
          description: "E2E Restaurant Corrected",
          counterparty: "Restaurant Inc",
          amountMinor: 32_00,
          currency: "EUR",
          categoryId,
        },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(updated.amountMinor, 32_00)

    const summary = await rpc((client) =>
      client.payments.summary({ cycleId }, withSession(couple.owner.session)),
    )
    assert.equal(summary.cycleTotalMinor, 45_50 + 32_00)
    const categorySpend = summary.byCategory.find((c) => c.categoryId === categoryId)
    assert.equal(categorySpend?.spentMinor, 45_50 + 32_00)

    await rpc((client) =>
      client.payments.remove({ id: dinner.id }, withSession(couple.owner.session)),
    )
    const afterRemove = await rpc((client) =>
      client.payments.list({ cycleId }, withSession(couple.owner.session)),
    )
    assert.equal(afterRemove.length, 1)
  })

  it("exports the cycle's payments as CSV", async () => {
    await rpc((client) =>
      client.payments.create(
        {
          accountId: sharedAccountId,
          bookedAt: cycleStart,
          description: "E2E CSV Payment",
          counterparty: "CSV Export Co",
          amountMinor: 12_34,
          currency: "EUR",
          categoryId,
        },
        withSession(couple.owner.session),
      ),
    )

    const csv = await exportCsv(couple.owner.session, cycleId)
    assert.match(csv, /E2E CSV Payment/)
    assert.match(csv, /12\.34|1234/)
  })
})
