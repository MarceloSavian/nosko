import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import { Either } from "effect"
import { disposeApiRuntime, rpc, rpcEither, withSession } from "../client/apiClient.ts"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../db.ts"
import { seedHouseholdCategory } from "../helpers/categories.ts"
import { cleanupTestData } from "../helpers/cleanup.ts"
import { type Couple, setupCouple } from "../support/fixtures.ts"

describe("cycles, fixed bills and recurring rules", () => {
  let db: AdminDb
  let couple: Couple
  let categoryId: string

  before(async () => {
    db = await connectAdminDb()
    couple = await setupCouple(db)
    categoryId = await seedHouseholdCategory(db, couple.householdId, "E2E Groceries")
  })

  after(async () => {
    await cleanupTestData(db, {
      householdIds: [couple.householdId],
      userIds: couple.cleanupUserIds,
    })
    await closeAdminDb(db)
    await disposeApiRuntime()
  })

  it("creates the current cycle and rejects creating a second one for the same period", async () => {
    const cycle = await rpc((client) =>
      client.cycles.create(
        {
          title: "E2E Cycle",
          reserveMinor: 10_000,
          estimateMinor: null,
          seedOpeningBalanceMinor: null,
        },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(cycle.status, "open")
    assert.equal(cycle.reserveMinor, 10_000)

    const duplicate = await rpcEither((client) =>
      client.cycles.create(
        {
          title: "Second cycle",
          reserveMinor: 0,
          estimateMinor: null,
          seedOpeningBalanceMinor: null,
        },
        withSession(couple.owner.session),
      ),
    )
    assert.ok(Either.isLeft(duplicate))
    assert.equal(duplicate.left._tag, "CycleAlreadyExists")
  })

  it("records income for both members and reflects it in cycle figures", async () => {
    const current = await rpc((client) =>
      client.cycles.getCurrent(undefined, withSession(couple.owner.session)),
    )
    assert.ok(current !== null)
    const cycleId = current.cycle.id

    await rpc((client) =>
      client.cycles.setIncome(
        { cycleId, memberUserId: couple.owner.id, kind: "salary", amountMinor: 300_000 },
        withSession(couple.owner.session),
      ),
    )
    await rpc((client) =>
      client.cycles.setIncome(
        { cycleId, memberUserId: couple.partner.id, kind: "salary", amountMinor: 250_000 },
        withSession(couple.partner.session),
      ),
    )

    const detail = await rpc((client) =>
      client.cycles.get({ id: cycleId }, withSession(couple.owner.session)),
    )
    assert.equal(detail.incomes.length, 2)
    assert.equal(detail.figures.income, 550_000)
  })

  it("sets category caps for the cycle", async () => {
    const current = await rpc((client) =>
      client.cycles.getCurrent(undefined, withSession(couple.owner.session)),
    )
    assert.ok(current !== null)

    const caps = await rpc((client) =>
      client.cycles.setCategoryCaps(
        { cycleId: current.cycle.id, caps: [{ categoryId, capMinor: 50_000 }] },
        withSession(couple.owner.session),
      ),
    )
    assert.deepEqual(caps, [{ categoryId, capMinor: 50_000 }])
  })

  it("records and settles a member transfer", async () => {
    const current = await rpc((client) =>
      client.cycles.getCurrent(undefined, withSession(couple.owner.session)),
    )
    assert.ok(current !== null)

    const transfer = await rpc((client) =>
      client.cycles.recordTransfer(
        {
          cycleId: current.cycle.id,
          memberUserId: couple.partner.id,
          direction: "to_household",
          amountMinor: 5_000,
          method: "bank_transfer",
        },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(transfer.settledAt, null)

    const settled = await rpc((client) =>
      client.cycles.settleTransfer({ transferId: transfer.id }, withSession(couple.owner.session)),
    )
    assert.ok(settled.settledAt !== null)
  })

  it("creates and pays a fixed bill", async () => {
    const current = await rpc((client) =>
      client.cycles.getCurrent(undefined, withSession(couple.owner.session)),
    )
    assert.ok(current !== null)

    const bill = await rpc((client) =>
      client.bills.create(
        {
          cycleId: current.cycle.id,
          recurringRuleId: null,
          label: "E2E Rent",
          amountMinor: 120_000,
          payingAccountId: null,
          dueDay: 5,
          categoryId,
          sortOrder: 0,
        },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(bill.paid, false)

    const paid = await rpc((client) =>
      client.bills.setPaid(
        { id: bill.id, paid: true, paidOnDay: 5 },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(paid.paid, true)

    const listed = await rpc((client) =>
      client.bills.list({ cycleId: current.cycle.id }, withSession(couple.owner.session)),
    )
    assert.ok(listed.some((b) => b.id === bill.id))

    await rpc((client) => client.bills.remove({ id: bill.id }, withSession(couple.owner.session)))
    const afterRemove = await rpcEither((client) =>
      client.bills.setPaid(
        { id: bill.id, paid: false, paidOnDay: null },
        withSession(couple.owner.session),
      ),
    )
    assert.ok(Either.isLeft(afterRemove))
    assert.equal(afterRemove.left._tag, "FixedBillNotFound")
  })

  it("creates, updates and deactivates a recurring rule", async () => {
    const rule = await rpc((client) =>
      client.rules.create(
        {
          matchType: "vendor_exact",
          matcher: "E2E Landlord",
          expectedAmountMinor: 120_000,
          currency: "EUR",
          categoryId,
          cadence: "monthly",
          isFixedBill: true,
        },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(rule.active, true)

    const updated = await rpc((client) =>
      client.rules.update(
        {
          id: rule.id,
          matcher: "E2E Landlord LLC",
          expectedAmountMinor: 121_000,
          currency: "EUR",
          categoryId,
          cadence: "monthly",
          isFixedBill: true,
        },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(updated.matcher, "E2E Landlord LLC")

    const deactivated = await rpc((client) =>
      client.rules.deactivate({ id: rule.id }, withSession(couple.owner.session)),
    )
    assert.equal(deactivated.active, false)

    const listed = await rpc((client) =>
      client.rules.list(undefined, withSession(couple.owner.session)),
    )
    assert.ok(listed.some((r) => r.id === rule.id && r.active === false))
  })

  it("closes the cycle and rejects further mutation", async () => {
    const current = await rpc((client) =>
      client.cycles.getCurrent(undefined, withSession(couple.owner.session)),
    )
    assert.ok(current !== null)

    const closed = await rpc((client) =>
      client.cycles.close({ id: current.cycle.id }, withSession(couple.owner.session)),
    )
    assert.equal(closed.status, "closed")

    const result = await rpcEither((client) =>
      client.bills.create(
        {
          cycleId: current.cycle.id,
          recurringRuleId: null,
          label: "Too late",
          amountMinor: 1_00,
          payingAccountId: null,
          dueDay: null,
          categoryId,
          sortOrder: 0,
        },
        withSession(couple.owner.session),
      ),
    )
    assert.ok(Either.isLeft(result))
    assert.equal(result.left._tag, "CycleClosed")
  })
})
