import { Schema } from "effect"

export const AuthTokenType = Schema.Literal("email_verify", "password_reset", "mfa_otp")
export type AuthTokenType = typeof AuthTokenType.Type

export const AuthToken = Schema.Struct({
  id: Schema.UUID,
  userId: Schema.UUID,
  type: AuthTokenType,
  expiresAt: Schema.DateTimeUtcFromDate,
  consumedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
})
export type AuthToken = typeof AuthToken.Type

export interface NewAuthToken {
  readonly userId: string
  readonly type: AuthTokenType
  readonly tokenHash: string
  readonly expiresAt: Date
}
