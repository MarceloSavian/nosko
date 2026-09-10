import { Schema } from "effect"

export class HouseholdFull extends Schema.TaggedError<HouseholdFull>("HouseholdFull")(
  "HouseholdFull",
  { householdId: Schema.String },
) {}

export const InvitationInvalidReason = Schema.Literal(
  "not_found",
  "expired",
  "not_pending",
  "email_mismatch",
)
export type InvitationInvalidReason = typeof InvitationInvalidReason.Type

export class InvitationInvalid extends Schema.TaggedError<InvitationInvalid>("InvitationInvalid")(
  "InvitationInvalid",
  { reason: InvitationInvalidReason },
) {}

export class NotHouseholdOwner extends Schema.TaggedError<NotHouseholdOwner>("NotHouseholdOwner")(
  "NotHouseholdOwner",
  {},
) {}

export class NoHousehold extends Schema.TaggedError<NoHousehold>("NoHousehold")(
  "NoHousehold",
  {},
) {}
