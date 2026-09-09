import { Schema } from "effect"

export const UserSession = Schema.Struct({
  id: Schema.UUID,
  userId: Schema.UUID,
  deviceLabel: Schema.NullOr(Schema.String),
  mfaTrustedUntil: Schema.NullOr(Schema.DateTimeUtcFromDate),
  expiresAt: Schema.DateTimeUtcFromDate,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
})
export type UserSession = typeof UserSession.Type

export interface NewUserSession {
  readonly userId: string
  readonly refreshTokenHash: string
  readonly deviceLabel: string | null
  readonly mfaTrustedUntil: Date | null
  readonly expiresAt: Date
}
