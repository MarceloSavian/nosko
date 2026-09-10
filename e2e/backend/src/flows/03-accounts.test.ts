import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import { Either } from "effect"
import { disposeApiRuntime, rpc, rpcEither, withSession } from "../client/apiClient.ts"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../db.ts"
import { cleanupTestData } from "../helpers/cleanup.ts"
import { type Couple, setupCouple } from "../support/fixtures.ts"

const newSoleAccount = {
  ownership: "sole" as const,
  visibility: "personal" as const,
  institution: "revolut" as const,
  nickname: "Owner Checking",
  type: "checking" as const,
  currency: "EUR",
  maskedId: null,
  balanceMinor: 100_00,
  purpose: null,
  statementCloseDay: null,
  creditLimitMinor: null,
  autopayAccountId: null,
}

const newJointAccount = {
  ownership: "joint" as const,
  visibility: "shared" as const,
  institution: "ing" as const,
  nickname: "Joint Checking",
  type: "checking" as const,
  currency: "EUR",
  maskedId: null,
  balanceMinor: 500_00,
  purpose: null,
  statementCloseDay: null,
  creditLimitMinor: null,
  autopayAccountId: null,
}

describe("accounts: personal vs shared, visibility, co-owner, summaries", () => {
  let db: AdminDb
  let couple: Couple

  before(async () => {
    db = await connectAdminDb()
    couple = await setupCouple(db)
  })

  after(async () => {
    await cleanupTestData(db, {
      householdIds: [couple.householdId],
      userIds: couple.cleanupUserIds,
    })
    await closeAdminDb(db)
    await disposeApiRuntime()
  })

  it("creates a personal account for the owner", async () => {
    const account = await rpc((client) =>
      client.accounts.create(newSoleAccount, withSession(couple.owner.session)),
    )
    assert.equal(account.ownerUserId, couple.owner.id)
    assert.equal(account.visibility, "personal")
  })

  it("creates a shared joint account with both members as owner/co-owner", async () => {
    const joint = await rpc((client) =>
      client.accounts.create(newJointAccount, withSession(couple.owner.session)),
    )
    const withCoOwner = await rpc((client) =>
      client.accounts.setCoOwner(
        { id: joint.id, coOwnerUserId: couple.partner.id },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(withCoOwner.coOwnerUserId, couple.partner.id)

    const sharedFromPartner = await rpc((client) =>
      client.accounts.list({ scope: "shared" }, withSession(couple.partner.session)),
    )
    assert.ok(sharedFromPartner.some((a) => a.id === joint.id))
  })

  it("the partner cannot see the owner's personal account (RLS privacy guarantee)", async () => {
    const ownerPersonal = await rpc((client) =>
      client.accounts.list({ scope: "personal" }, withSession(couple.owner.session)),
    )
    assert.ok(ownerPersonal.length > 0)

    const partnerView = await rpc((client) =>
      client.accounts.list({ scope: "personal" }, withSession(couple.partner.session)),
    )
    for (const ownerAccount of ownerPersonal) {
      assert.ok(
        !partnerView.some((a) => a.id === ownerAccount.id),
        `partner must not see owner's personal account ${ownerAccount.id}`,
      )
    }
  })

  it("cannot flip a joint account's visibility to personal", async () => {
    const joint = await rpc((client) =>
      client.accounts.create(newJointAccount, withSession(couple.owner.session)),
    )
    const result = await rpcEither((client) =>
      client.accounts.setVisibility(
        { id: joint.id, visibility: "personal" },
        withSession(couple.owner.session),
      ),
    )
    assert.ok(Either.isLeft(result))
    assert.equal(result.left._tag, "JointAccountVisibilityLocked")
  })

  it("updates and removes a personal account", async () => {
    const account = await rpc((client) =>
      client.accounts.create(
        { ...newSoleAccount, nickname: "Temp Account" },
        withSession(couple.owner.session),
      ),
    )
    const updated = await rpc((client) =>
      client.accounts.update(
        { id: account.id, ...newSoleAccount, nickname: "Renamed Account", balanceMinor: 42_00 },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(updated.nickname, "Renamed Account")
    assert.equal(updated.balanceMinor, 42_00)

    await rpc((client) =>
      client.accounts.remove({ id: account.id }, withSession(couple.owner.session)),
    )
    const afterRemove = await rpcEither((client) =>
      client.accounts.update(
        { id: account.id, ...newSoleAccount },
        withSession(couple.owner.session),
      ),
    )
    assert.ok(Either.isLeft(afterRemove))
    assert.equal(afterRemove.left._tag, "AccountNotFound")
  })

  it("summaries include the household's shared and the caller's personal accounts", async () => {
    const shared = await rpc((client) =>
      client.accounts.sharedSummary(undefined, withSession(couple.owner.session)),
    )
    assert.ok(shared.accounts.length > 0)
    assert.equal(typeof shared.totalBaseMinor, "number")

    const personal = await rpc((client) =>
      client.accounts.personalSummary(undefined, withSession(couple.owner.session)),
    )
    assert.ok(personal.accounts.length > 0)
    assert.equal(typeof personal.totalBaseMinor, "number")
  })
})
