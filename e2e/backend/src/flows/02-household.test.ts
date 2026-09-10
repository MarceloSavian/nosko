import assert from "node:assert/strict"
import { after, before, describe, it } from "node:test"
import { Either } from "effect"
import { disposeApiRuntime, rpc, rpcEither, withSession } from "../client/apiClient.ts"
import { type AdminDb, closeAdminDb, connectAdminDb } from "../db.ts"
import { cleanupTestData } from "../helpers/cleanup.ts"
import { findInvitationCode } from "../helpers/codes.ts"
import { uniqueEmail } from "../helpers/testData.ts"
import {
  type Couple,
  setupCouple,
  signUpVerifyAndLogIn,
  type TestUser,
} from "../support/fixtures.ts"

// One dispose for the whole file: apiClient's runtime is a module-level singleton, so disposing
// it inside a describe-scoped `after` would break any describe that runs after it in this file.
after(async () => {
  await disposeApiRuntime()
})

describe("household: create, invite, accept, membership", () => {
  let db: AdminDb
  let couple: Couple
  let outsider: TestUser

  before(async () => {
    db = await connectAdminDb()
    couple = await setupCouple(db)
    outsider = await signUpVerifyAndLogIn(db, "outsider")
  })

  after(async () => {
    await cleanupTestData(db, {
      householdIds: [couple.householdId],
      userIds: [...couple.cleanupUserIds, outsider.id],
    })
    await closeAdminDb(db)
  })

  it("owner sees the household, partner is a member of it", async () => {
    const view = await rpc((client) =>
      client.household.get(undefined, withSession(couple.owner.session)),
    )
    assert.equal(view?.id, couple.householdId)

    const members = await rpc((client) =>
      client.household.listMembers(undefined, withSession(couple.owner.session)),
    )
    assert.equal(members.length, 2)
    const roles = new Map(members.map((m) => [m.userId, m.role]))
    assert.equal(roles.get(couple.owner.id), "owner")
    assert.equal(roles.get(couple.partner.id), "member")
  })

  it("a user with no household sees null rather than someone else's household", async () => {
    const view = await rpc((client) =>
      client.household.get(undefined, withSession(outsider.session)),
    )
    assert.equal(view, null)
  })

  it("rejects a third invitation once the household already has 2 members", async () => {
    const result = await rpcEither((client) =>
      client.household.invite(
        { email: uniqueEmail("third-wheel") },
        withSession(couple.owner.session),
      ),
    )
    assert.ok(Either.isLeft(result))
    assert.equal(result.left._tag, "HouseholdFull")
  })

  it("only the owner can invite or revoke invitations", async () => {
    const asPartner = await rpcEither((client) =>
      client.household.invite({ email: uniqueEmail("nope") }, withSession(couple.partner.session)),
    )
    assert.ok(Either.isLeft(asPartner))
    assert.equal(asPartner.left._tag, "NotHouseholdOwner")
  })

  it("rejects acceptance with a wrong code", async () => {
    const wrongCode = await rpcEither((client) =>
      client.household.acceptInvitation(
        { householdId: couple.householdId, code: "000000" },
        withSession(couple.partner.session),
      ),
    )
    assert.ok(Either.isLeft(wrongCode))
    assert.equal(wrongCode.left._tag, "InvitationInvalid")
  })

  it("update changes the household's name and base currency", async () => {
    const updated = await rpc((client) =>
      client.household.update(
        { name: "E2E Household Renamed", baseCurrency: "USD" },
        withSession(couple.owner.session),
      ),
    )
    assert.equal(updated.name, "E2E Household Renamed")
    assert.equal(updated.baseCurrency, "USD")

    // restore so later assertions/other flow files relying on EUR seed data stay unaffected
    await rpc((client) =>
      client.household.update(
        { name: "E2E Household", baseCurrency: "EUR" },
        withSession(couple.owner.session),
      ),
    )
  })
})

describe("household: standalone invitation lifecycle", () => {
  let db: AdminDb
  const userIds: string[] = []
  const householdIds: string[] = []

  before(async () => {
    db = await connectAdminDb()
  })

  after(async () => {
    await cleanupTestData(db, { householdIds, userIds })
    await closeAdminDb(db)
  })

  it("lists a pending invitation and lets the owner revoke it before acceptance", async () => {
    const owner = await signUpVerifyAndLogIn(db, "solo-owner")
    userIds.push(owner.id)
    const household = await rpc((client) =>
      client.household.create(
        { name: "Solo Household", baseCurrency: "EUR" },
        withSession(owner.session),
      ),
    )
    householdIds.push(household.id)

    const inviteeEmail = uniqueEmail("invitee")
    const invitation = await rpc((client) =>
      client.household.invite({ email: inviteeEmail }, withSession(owner.session)),
    )
    assert.equal(invitation.status, "pending")

    const listed = await rpc((client) =>
      client.household.listInvitations(undefined, withSession(owner.session)),
    )
    assert.ok(listed.some((i) => i.id === invitation.id && i.status === "pending"))

    await rpc((client) =>
      client.household.revokeInvitation(
        { invitationId: invitation.id },
        withSession(owner.session),
      ),
    )

    const afterRevoke = await rpc((client) =>
      client.household.listInvitations(undefined, withSession(owner.session)),
    )
    assert.equal(afterRevoke.find((i) => i.id === invitation.id)?.status, "revoked")
  })

  it("removes a member from the household", async () => {
    const owner = await signUpVerifyAndLogIn(db, "removes-owner")
    const member = await signUpVerifyAndLogIn(db, "removes-member")
    userIds.push(owner.id, member.id)
    const household = await rpc((client) =>
      client.household.create(
        { name: "Remove Household", baseCurrency: "EUR" },
        withSession(owner.session),
      ),
    )
    householdIds.push(household.id)

    await rpc((client) =>
      client.household.invite({ email: member.email }, withSession(owner.session)),
    )
    const code = await findInvitationCode(db, member.email)
    await rpc((client) =>
      client.household.acceptInvitation(
        { householdId: household.id, code },
        withSession(member.session),
      ),
    )

    await rpc((client) =>
      client.household.removeMember({ userId: member.id }, withSession(owner.session)),
    )

    const members = await rpc((client) =>
      client.household.listMembers(undefined, withSession(owner.session)),
    )
    assert.equal(members.length, 1)
    assert.equal(members[0]?.userId, owner.id)
  })
})
