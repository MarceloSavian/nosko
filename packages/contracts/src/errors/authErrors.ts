import { Schema } from "effect"

export class EmailAlreadyRegistered extends Schema.TaggedError<EmailAlreadyRegistered>(
  "EmailAlreadyRegistered",
)("EmailAlreadyRegistered", { email: Schema.String }) {}

export class UserNotFound extends Schema.TaggedError<UserNotFound>("UserNotFound")("UserNotFound", {
  userId: Schema.String,
}) {}

export class InvalidCredentials extends Schema.TaggedError<InvalidCredentials>(
  "InvalidCredentials",
)("InvalidCredentials", {}) {}

export class EmailNotVerified extends Schema.TaggedError<EmailNotVerified>("EmailNotVerified")(
  "EmailNotVerified",
  { userId: Schema.String },
) {}

export const TokenInvalidReason = Schema.Literal("not_found", "expired", "consumed", "wrong_type")
export type TokenInvalidReason = typeof TokenInvalidReason.Type

export class TokenInvalid extends Schema.TaggedError<TokenInvalid>("TokenInvalid")("TokenInvalid", {
  reason: TokenInvalidReason,
}) {}

export class MfaCodeInvalid extends Schema.TaggedError<MfaCodeInvalid>("MfaCodeInvalid")(
  "MfaCodeInvalid",
  {},
) {}

export class MfaAlreadyEnabled extends Schema.TaggedError<MfaAlreadyEnabled>("MfaAlreadyEnabled")(
  "MfaAlreadyEnabled",
  {},
) {}

export const SessionInvalidReason = Schema.Literal("not_found", "revoked", "expired", "invalid")
export type SessionInvalidReason = typeof SessionInvalidReason.Type

export class SessionInvalid extends Schema.TaggedError<SessionInvalid>("SessionInvalid")(
  "SessionInvalid",
  { reason: SessionInvalidReason },
) {}
