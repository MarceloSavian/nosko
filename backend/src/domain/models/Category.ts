import { Schema } from "effect"

export const CategoryScope = Schema.Literal("household", "personal")
export type CategoryScope = typeof CategoryScope.Type

export const Category = Schema.Struct({
  id: Schema.UUID,
  householdId: Schema.UUID,
  scope: CategoryScope,
  ownerUserId: Schema.NullOr(Schema.UUID),
  name: Schema.String,
  color: Schema.NullOr(Schema.String),
  sortOrder: Schema.Int,
})
export type Category = typeof Category.Type

export const NewHouseholdCategory = Schema.Struct({
  householdId: Schema.UUID,
  name: Schema.String,
  color: Schema.NullOr(Schema.String),
  sortOrder: Schema.Int,
})
export type NewHouseholdCategory = typeof NewHouseholdCategory.Type

export const NewPersonalCategory = Schema.Struct({
  householdId: Schema.UUID,
  ownerUserId: Schema.UUID,
  name: Schema.String,
  color: Schema.NullOr(Schema.String),
  sortOrder: Schema.Int,
})
export type NewPersonalCategory = typeof NewPersonalCategory.Type
