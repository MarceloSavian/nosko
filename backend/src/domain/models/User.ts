import { Schema } from "effect"
import { Locale } from "./Locale"

export const User = Schema.Struct({
  id: Schema.UUID,
  email: Schema.String,
  name: Schema.String,
  preferredLocale: Locale,
  emailVerified: Schema.Boolean,
  mfaEnabled: Schema.Boolean,
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
})
export type User = typeof User.Type

export const NewUser = Schema.Struct({
  email: Schema.String,
  passwordHash: Schema.String,
  name: Schema.String,
  preferredLocale: Locale,
})
export type NewUser = typeof NewUser.Type

export const UserCredentials = Schema.Struct({
  id: Schema.UUID,
  email: Schema.String,
  passwordHash: Schema.String,
  emailVerified: Schema.Boolean,
  mfaEnabled: Schema.Boolean,
  mfaSecret: Schema.NullOr(Schema.String),
})
export type UserCredentials = typeof UserCredentials.Type
