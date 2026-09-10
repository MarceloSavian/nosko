import * as Rpc from "@effect/rpc/Rpc"
import * as RpcGroup from "@effect/rpc/RpcGroup"
import { Schema } from "effect"
import { AuthMiddleware } from "./authMiddleware.ts"
import {
  EmailAlreadyRegistered,
  MfaAlreadyEnabled,
  MfaCodeInvalid,
  SessionInvalid,
  TokenInvalid,
  UserNotFound,
} from "./errors/authErrors.ts"
import { Locale } from "./locale.ts"

export const AuthUserView = Schema.Struct({
  id: Schema.UUID,
  email: Schema.String,
  name: Schema.String,
  preferredLocale: Locale,
  emailVerified: Schema.Boolean,
  mfaEnabled: Schema.Boolean,
})
export type AuthUserView = typeof AuthUserView.Type

export const MfaEnrollmentView = Schema.Struct({
  secret: Schema.String,
  enrollmentUri: Schema.String,
})
export type MfaEnrollmentView = typeof MfaEnrollmentView.Type

export const SessionView = Schema.Struct({
  id: Schema.UUID,
  deviceLabel: Schema.NullOr(Schema.String),
  mfaTrustedUntil: Schema.NullOr(Schema.DateTimeUtc),
  expiresAt: Schema.DateTimeUtc,
  createdAt: Schema.DateTimeUtc,
})
export type SessionView = typeof SessionView.Type

export const AuthRpcs = RpcGroup.make(
  Rpc.make("auth.signUp", {
    payload: {
      name: Schema.String,
      email: Schema.String,
      password: Schema.String,
      preferredLocale: Locale,
    },
    success: AuthUserView,
    error: EmailAlreadyRegistered,
  }),
  Rpc.make("auth.verifyEmail", {
    payload: { userId: Schema.UUID, code: Schema.String },
    error: TokenInvalid,
  }),
  Rpc.make("auth.resendVerification", {
    payload: { userId: Schema.UUID },
    error: UserNotFound,
  }),
  Rpc.make("auth.mfaChallenge", {
    payload: { userId: Schema.UUID },
    error: UserNotFound,
  }),
  Rpc.make("auth.requestPasswordReset", {
    payload: { email: Schema.String },
  }),
  Rpc.make("auth.resetPassword", {
    payload: {
      email: Schema.String,
      code: Schema.String,
      newPassword: Schema.String,
      revokeOtherSessions: Schema.Boolean,
    },
    error: TokenInvalid,
  }),
  Rpc.make("auth.me", {
    success: AuthUserView,
  }).middleware(AuthMiddleware),
  Rpc.make("auth.mfaEnroll", {
    success: MfaEnrollmentView,
    error: MfaAlreadyEnabled,
  }).middleware(AuthMiddleware),
  Rpc.make("auth.mfaConfirmEnroll", {
    payload: { code: Schema.String },
    error: MfaCodeInvalid,
  }).middleware(AuthMiddleware),
  Rpc.make("auth.mfaDisable", {}).middleware(AuthMiddleware),
  Rpc.make("auth.listSessions", {
    success: Schema.Array(SessionView),
  }).middleware(AuthMiddleware),
  Rpc.make("auth.revokeSession", {
    payload: { sessionId: Schema.UUID },
    error: SessionInvalid,
  }).middleware(AuthMiddleware),
  Rpc.make("auth.revokeAllSessions", {}).middleware(AuthMiddleware),
)
