import { Effect, Option } from "effect"
import { HouseholdFull, InvitationInvalid } from "../../domain/errors/HouseholdErrors"
import type { Locale } from "../../domain/models/Locale"
import { OpaqueTokens } from "../../infra/auth/OpaqueTokens"
import { householdInvitationEmail } from "../../infra/mailer/EmailTemplates"
import { Mailer } from "../../infra/mailer/Mailer"
import { HouseholdInvitationsRepository } from "../protocols/HouseholdInvitationsRepository"
import { HouseholdsRepository } from "../protocols/HouseholdsRepository"

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface InviteMemberInput {
  readonly householdId: string
  readonly invitedBy: string
  readonly inviterName: string
  readonly householdName: string
  readonly email: string
  readonly locale: Locale
}

export const inviteMember = (input: InviteMemberInput) =>
  Effect.gen(function* () {
    const households = yield* HouseholdsRepository
    const invitations = yield* HouseholdInvitationsRepository
    const opaqueTokens = yield* OpaqueTokens
    const mailer = yield* Mailer

    const members = yield* households.listMembers(input.householdId)
    if (members.length >= 2) {
      return yield* Effect.fail(new HouseholdFull({ householdId: input.householdId }))
    }

    const { code, hash } = opaqueTokens.generateCode()
    const invitation = yield* invitations.create({
      householdId: input.householdId,
      email: input.email,
      tokenHash: hash,
      invitedBy: input.invitedBy,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    })

    yield* mailer
      .send({
        to: input.email,
        ...householdInvitationEmail(input.locale, input.inviterName, input.householdName, code),
      })
      .pipe(Effect.ignore)

    return invitation
  })

export interface AcceptInvitationInput {
  readonly householdId: string
  readonly code: string
  readonly acceptingUserId: string
  readonly acceptingUserEmail: string
}

export const acceptInvitation = (input: AcceptInvitationInput) =>
  Effect.gen(function* () {
    const households = yield* HouseholdsRepository
    const invitations = yield* HouseholdInvitationsRepository
    const opaqueTokens = yield* OpaqueTokens

    const hash = opaqueTokens.hash(input.code)
    const found = yield* invitations.findPendingByTokenHash(input.householdId, hash)
    if (Option.isNone(found)) {
      return yield* Effect.fail(new InvitationInvalid({ reason: "not_found" }))
    }
    const invitation = found.value

    if (invitation.email !== input.acceptingUserEmail) {
      return yield* Effect.fail(new InvitationInvalid({ reason: "email_mismatch" }))
    }

    const member = yield* households.addMember({
      householdId: input.householdId,
      userId: input.acceptingUserId,
      role: "member",
      displayName: null,
    })

    yield* invitations.markAccepted(invitation.id, input.acceptingUserId)

    return member
  })

export const revokeInvitation = (invitationId: string) =>
  Effect.gen(function* () {
    const invitations = yield* HouseholdInvitationsRepository
    yield* invitations.revoke(invitationId)
  })
