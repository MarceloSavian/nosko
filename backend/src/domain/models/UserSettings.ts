import { Schema } from "effect"

export const UserSettings = Schema.Struct({
  userId: Schema.UUID,
  personalSpendCapMinor: Schema.NullOr(Schema.Int),
  currency: Schema.String,
  updatedAt: Schema.DateTimeUtcFromDate,
})
export type UserSettings = typeof UserSettings.Type
