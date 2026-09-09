import { Schema } from "effect"

export const HouseholdMemberRole = Schema.Literal("owner", "member")
export type HouseholdMemberRole = typeof HouseholdMemberRole.Type

export const Household = Schema.Struct({
  id: Schema.UUID,
  name: Schema.String,
  baseCurrency: Schema.String,
  createdBy: Schema.UUID,
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
})
export type Household = typeof Household.Type

export const NewHousehold = Schema.Struct({
  name: Schema.String,
  baseCurrency: Schema.String,
  createdBy: Schema.UUID,
})
export type NewHousehold = typeof NewHousehold.Type

export const HouseholdSettings = Schema.Struct({
  householdId: Schema.UUID,
  cycleAnchorDay: Schema.Int,
  locale: Schema.String,
  baseCurrency: Schema.String,
  defaultReserveMinor: Schema.Int,
  box3AllowanceMinor: Schema.Int,
  box3Rate: Schema.Number,
  inflationRate: Schema.Number,
  updatedAt: Schema.DateTimeUtcFromDate,
})
export type HouseholdSettings = typeof HouseholdSettings.Type

export const HouseholdMember = Schema.Struct({
  householdId: Schema.UUID,
  userId: Schema.UUID,
  role: HouseholdMemberRole,
  displayName: Schema.NullOr(Schema.String),
  joinedAt: Schema.DateTimeUtcFromDate,
})
export type HouseholdMember = typeof HouseholdMember.Type
