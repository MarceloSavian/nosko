import { describe, expect, it } from "@jest/globals"
import { Effect } from "effect"
import { OpaqueTokensLive } from "../../infra/auth/OpaqueTokens"
import { makeFakeMailer } from "../../test/fakeMailer"
import {
  makeFakeHouseholdInvitationsRepository,
  makeFakeHouseholdsRepository,
} from "../../test/fakeRepositories"
import { acceptInvitation, inviteMember, revokeInvitation } from "./HouseholdInvitations"

const household = {
  id: "household-1",
  name: "Casa Marcelo & Gabriele",
  baseCurrency: "EUR",
  createdBy: "marcelo",
  createdAt: new Date() as never,
  updatedAt: new Date() as never,
}

const oneMemberSeed = {
  households: [household],
  members: [
    {
      householdId: household.id,
      userId: "marcelo",
      role: "owner" as const,
      displayName: null,
      joinedAt: new Date() as never,
    },
  ],
}

const twoMemberSeed = {
  households: [household],
  members: [
    ...oneMemberSeed.members,
    {
      householdId: household.id,
      userId: "gabriele",
      role: "member" as const,
      displayName: null,
      joinedAt: new Date() as never,
    },
  ],
}

describe("inviteMember", () => {
  it("creates a pending invitation and emails the code", async () => {
    const { layer: householdsLayer } = makeFakeHouseholdsRepository(oneMemberSeed)
    const { layer: invitationsLayer, invitations } = makeFakeHouseholdInvitationsRepository()
    const { layer: mailerLayer, sent } = makeFakeMailer()

    const invitation = await Effect.runPromise(
      inviteMember({
        householdId: household.id,
        invitedBy: "marcelo",
        inviterName: "Marcelo",
        householdName: household.name,
        email: "gabriele@example.com",
        locale: "pt-BR",
      }).pipe(
        Effect.provide(householdsLayer),
        Effect.provide(invitationsLayer),
        Effect.provide(mailerLayer),
        Effect.provide(OpaqueTokensLive),
      ),
    )

    expect(invitation.status).toBe("pending")
    expect(invitations.size).toBe(1)
    expect(sent).toHaveLength(1)
    expect(sent[0]?.to).toBe("gabriele@example.com")
  })

  it("fails with HouseholdFull once the household already has two members", async () => {
    const { layer: householdsLayer } = makeFakeHouseholdsRepository(twoMemberSeed)
    const { layer: invitationsLayer } = makeFakeHouseholdInvitationsRepository()
    const { layer: mailerLayer } = makeFakeMailer()

    const exit = await Effect.runPromiseExit(
      inviteMember({
        householdId: household.id,
        invitedBy: "marcelo",
        inviterName: "Marcelo",
        householdName: household.name,
        email: "third@example.com",
        locale: "pt-BR",
      }).pipe(
        Effect.provide(householdsLayer),
        Effect.provide(invitationsLayer),
        Effect.provide(mailerLayer),
        Effect.provide(OpaqueTokensLive),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })
})

const inviteAndCaptureCode = async () => {
  const { layer: householdsLayer, members } = makeFakeHouseholdsRepository(oneMemberSeed)
  const { layer: invitationsLayer, invitations } = makeFakeHouseholdInvitationsRepository()
  const { layer: mailerLayer, sent } = makeFakeMailer()

  await Effect.runPromise(
    inviteMember({
      householdId: household.id,
      invitedBy: "marcelo",
      inviterName: "Marcelo",
      householdName: household.name,
      email: "gabriele@example.com",
      locale: "pt-BR",
    }).pipe(
      Effect.provide(householdsLayer),
      Effect.provide(invitationsLayer),
      Effect.provide(mailerLayer),
      Effect.provide(OpaqueTokensLive),
    ),
  )

  const code = sent[0]?.text.match(/\d{6}/)?.[0] as string

  return { householdsLayer, members, invitationsLayer, invitations, code }
}

describe("acceptInvitation", () => {
  it("adds the invited email as a member and marks the invitation accepted", async () => {
    const { householdsLayer, members, invitationsLayer, invitations, code } =
      await inviteAndCaptureCode()

    await Effect.runPromise(
      acceptInvitation({
        householdId: household.id,
        code,
        acceptingUserId: "gabriele",
        acceptingUserEmail: "gabriele@example.com",
      }).pipe(
        Effect.provide(householdsLayer),
        Effect.provide(invitationsLayer),
        Effect.provide(OpaqueTokensLive),
      ),
    )

    expect(members.some((m) => m.userId === "gabriele")).toBe(true)
    expect([...invitations.values()][0]?.status).toBe("accepted")
  })

  it("fails with InvitationInvalid for a wrong code", async () => {
    const { householdsLayer, invitationsLayer } = await inviteAndCaptureCode()

    const exit = await Effect.runPromiseExit(
      acceptInvitation({
        householdId: household.id,
        code: "000000",
        acceptingUserId: "gabriele",
        acceptingUserEmail: "gabriele@example.com",
      }).pipe(
        Effect.provide(householdsLayer),
        Effect.provide(invitationsLayer),
        Effect.provide(OpaqueTokensLive),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("fails with InvitationInvalid when the accepting email does not match", async () => {
    const { householdsLayer, invitationsLayer, code } = await inviteAndCaptureCode()

    const exit = await Effect.runPromiseExit(
      acceptInvitation({
        householdId: household.id,
        code,
        acceptingUserId: "someone-else",
        acceptingUserEmail: "someone-else@example.com",
      }).pipe(
        Effect.provide(householdsLayer),
        Effect.provide(invitationsLayer),
        Effect.provide(OpaqueTokensLive),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })
})

describe("revokeInvitation", () => {
  it("marks an invitation revoked", async () => {
    const { invitationsLayer, invitations, code: _code } = await inviteAndCaptureCode()
    const invitationId = [...invitations.keys()][0] as string

    await Effect.runPromise(revokeInvitation(invitationId).pipe(Effect.provide(invitationsLayer)))

    expect(invitations.get(invitationId)?.status).toBe("revoked")
  })
})
