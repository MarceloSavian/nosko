import { Schema } from "effect"

export const HouseholdInvitationStatus = Schema.Literal("pending", "accepted", "revoked", "expired")
export type HouseholdInvitationStatus = typeof HouseholdInvitationStatus.Type

export const HouseholdInvitation = Schema.Struct({
  id: Schema.UUID,
  householdId: Schema.UUID,
  email: Schema.String,
  invitedBy: Schema.UUID,
  status: HouseholdInvitationStatus,
  expiresAt: Schema.DateTimeUtcFromDate,
  acceptedBy: Schema.NullOr(Schema.UUID),
  createdAt: Schema.DateTimeUtcFromDate,
})
export type HouseholdInvitation = typeof HouseholdInvitation.Type

export interface NewHouseholdInvitation {
  readonly householdId: string
  readonly email: string
  readonly tokenHash: string
  readonly invitedBy: string
  readonly expiresAt: Date
}
