import { Data } from "effect"

export class HouseholdFull extends Data.TaggedError("HouseholdFull")<{
  readonly householdId: string
}> {}

export class InvitationInvalid extends Data.TaggedError("InvitationInvalid")<{
  readonly reason: "not_found" | "expired" | "not_pending" | "email_mismatch"
}> {}
