import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import { Either } from "effect"
import { disposeApiRuntime, rpc, rpcEither, withSession } from "../client/apiClient.ts"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../db.ts"
import { seedHouseholdCategory, seedPersonalCategory } from "../helpers/categories.ts"
import { cleanupTestData } from "../helpers/cleanup.ts"
import { signUpVerifyAndLogIn, type TestUser } from "../support/fixtures.ts"

// Non-negotiable: two unrelated households must be fully opaque to each other, including by
// guessing/reusing another household's row ids (accounts, cycles, bills, rules, payments,
// categories). Every check below expects a "not found" style error, never real data.

const soleAccountPayload = {
  ownership: "sole" as const,
  visibility: "personal" as const,
  institution: "other" as const,
  nickname: "Household A Personal",
  type: "checking" as const,
  currency: "EUR",
  maskedId: null,
  balanceMinor: 1_00,
  purpose: null,
  statementCloseDay: null,
  creditLimitMinor: null,
  autopayAccountId: null,
}

describe("privacy: cross-household RLS isolation", () => {
  let db: AdminDb
  let ownerA: TestUser
  let ownerB: TestUser
  let householdAId: string
  let householdBId: string
  let accountAId: string
  let cycleAId: string
  let billAId: string
  let ruleAId: string
  let paymentAId: string
  let personalCategoryAId: string

  before(async () => {
    db = await connectAdminDb()
    ownerA = await signUpVerifyAndLogIn(db, "isolA")
    ownerB = await signUpVerifyAndLogIn(db, "isolB")

    const householdA = await rpc((client) =>
      client.household.create(
        { name: "Household A", baseCurrency: "EUR" },
        withSession(ownerA.session),
      ),
    )
    householdAId = householdA.id
    const householdB = await rpc((client) =>
      client.household.create(
        { name: "Household B", baseCurrency: "EUR" },
        withSession(ownerB.session),
      ),
    )
    householdBId = householdB.id

    const categoryId = await seedHouseholdCategory(db, householdAId, "A Category")
    personalCategoryAId = await seedPersonalCategory(
      db,
      householdAId,
      ownerA.id,
      "A Personal Category",
    )

    const account = await rpc((client) =>
      client.accounts.create(
        { ...soleAccountPayload, visibility: "shared", ownership: "joint" },
        withSession(ownerA.session),
      ),
    )
    accountAId = account.id

    const cycle = await rpc((client) =>
      client.cycles.create(
        { title: "A Cycle", reserveMinor: 0, estimateMinor: null, seedOpeningBalanceMinor: null },
        withSession(ownerA.session),
      ),
    )
    cycleAId = cycle.id

    const bill = await rpc((client) =>
      client.bills.create(
        {
          cycleId: cycleAId,
          recurringRuleId: null,
          label: "A Bill",
          amountMinor: 10_00,
          payingAccountId: null,
          dueDay: null,
          categoryId,
          sortOrder: 0,
        },
        withSession(ownerA.session),
      ),
    )
    billAId = bill.id

    const rule = await rpc((client) =>
      client.rules.create(
        {
          matchType: "vendor_exact",
          matcher: "A Vendor",
          expectedAmountMinor: null,
          currency: null,
          categoryId,
          cadence: "monthly",
          isFixedBill: false,
        },
        withSession(ownerA.session),
      ),
    )
    ruleAId = rule.id

    const payment = await rpc((client) =>
      client.payments.create(
        {
          accountId: accountAId,
          bookedAt: cycle.startDate,
          description: "A Payment",
          counterparty: null,
          amountMinor: 5_00,
          currency: "EUR",
          categoryId,
        },
        withSession(ownerA.session),
      ),
    )
    paymentAId = payment.id
  })

  after(async () => {
    await cleanupTestData(db, {
      householdIds: [householdAId, householdBId],
      userIds: [ownerA.id, ownerB.id],
    })
    await closeAdminDb(db)
    await disposeApiRuntime()
  })

  it("household B cannot see household A's accounts, even in shared summaries", async () => {
    const sharedFromB = await rpc((client) =>
      client.accounts.sharedSummary(undefined, withSession(ownerB.session)),
    )
    assert.ok(!sharedFromB.accounts.some((entry) => entry.account.id === accountAId))
  })

  it("household B cannot update, re-visibility, or remove household A's account by id", async () => {
    const update = await rpcEither((client) =>
      client.accounts.update(
        { id: accountAId, ...soleAccountPayload },
        withSession(ownerB.session),
      ),
    )
    assert.ok(Either.isLeft(update))
    assert.equal(update.left._tag, "AccountNotFound")

    const remove = await rpcEither((client) =>
      client.accounts.remove({ id: accountAId }, withSession(ownerB.session)),
    )
    assert.ok(Either.isLeft(remove))
    assert.equal(remove.left._tag, "AccountNotFound")
  })

  it("household B cannot read or close household A's cycle by id", async () => {
    const get = await rpcEither((client) =>
      client.cycles.get({ id: cycleAId }, withSession(ownerB.session)),
    )
    assert.ok(Either.isLeft(get))
    assert.equal(get.left._tag, "CycleNotFound")

    const close = await rpcEither((client) =>
      client.cycles.close({ id: cycleAId }, withSession(ownerB.session)),
    )
    assert.ok(Either.isLeft(close))
    assert.equal(close.left._tag, "CycleNotFound")

    const own = await rpc((client) => client.cycles.list(undefined, withSession(ownerB.session)))
    assert.ok(!own.some((c) => c.id === cycleAId))
  })

  it("household B cannot mutate household A's fixed bill or recurring rule by id", async () => {
    const bill = await rpcEither((client) =>
      client.bills.setPaid({ id: billAId, paid: true, paidOnDay: 1 }, withSession(ownerB.session)),
    )
    assert.ok(Either.isLeft(bill))
    assert.equal(bill.left._tag, "FixedBillNotFound")

    const rule = await rpcEither((client) =>
      client.rules.deactivate({ id: ruleAId }, withSession(ownerB.session)),
    )
    assert.ok(Either.isLeft(rule))
    assert.equal(rule.left._tag, "RecurringRuleNotFound")
  })

  it("household B cannot read or update household A's shared payment by id", async () => {
    const update = await rpcEither((client) =>
      client.payments.update(
        {
          id: paymentAId,
          description: "hijacked",
          counterparty: null,
          amountMinor: 1,
          currency: "EUR",
          categoryId: personalCategoryAId,
        },
        withSession(ownerB.session),
      ),
    )
    assert.ok(Either.isLeft(update))
    assert.equal(update.left._tag, "SharedPaymentNotFound")

    // household B has no cycle with this id at all, so listing must fail closed with
    // CycleNotFound rather than leak A's payments or silently return an empty list.
    const listed = await rpcEither((client) =>
      client.payments.list({ cycleId: cycleAId }, withSession(ownerB.session)),
    )
    assert.ok(Either.isLeft(listed))
    assert.equal(listed.left._tag, "CycleNotFound")
  })
})
