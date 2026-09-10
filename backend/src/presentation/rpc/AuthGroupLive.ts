import { SqlClient } from "@effect/sql"
import { AuthRpcs, CurrentUser } from "@nosko/contracts"
import { Effect, Option } from "effect"
import { UsersRepository } from "../../data/protocols/UsersRepository"
import { mfaChallenge, mfaConfirmEnroll, mfaDisable, mfaEnroll } from "../../data/usecases/Mfa"
import { requestPasswordReset, resetPassword } from "../../data/usecases/PasswordReset"
import { listSessions, revokeAllSessions, revokeSession } from "../../data/usecases/Sessions"
import { resendVerification, signUp, verifyEmail } from "../../data/usecases/SignUp"
import { TokenInvalid, UserNotFound } from "../../domain/errors/AuthErrors"
import { withRlsScope } from "../../infra/db/RequestScope"
import { dieOnSqlError } from "./dieOnSqlError"

const dieIfMissing = <A>(found: Option.Option<A>) =>
  Option.match(found, {
    onNone: () => Effect.die(new Error("authenticated user vanished mid-request")),
    onSome: Effect.succeed,
  })

export const AuthGroupLive = AuthRpcs.toLayer(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const users = yield* UsersRepository

    return {
      "auth.signUp": (payload) =>
        sql.withTransaction(signUp(payload)).pipe(
          dieOnSqlError,
          Effect.map((user) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            preferredLocale: user.preferredLocale,
            emailVerified: user.emailVerified,
            mfaEnabled: user.mfaEnabled,
          })),
        ),

      "auth.verifyEmail": (payload) =>
        withRlsScope({ userId: payload.userId }, verifyEmail(payload)),

      "auth.resendVerification": (payload) =>
        withRlsScope({ userId: payload.userId }, resendVerification(payload.userId)),

      "auth.mfaChallenge": (payload) =>
        Effect.gen(function* () {
          const found = yield* users.findById(payload.userId).pipe(dieOnSqlError)
          if (Option.isNone(found)) {
            return yield* Effect.fail(new UserNotFound({ userId: payload.userId }))
          }
          const user = found.value
          yield* withRlsScope(
            { userId: payload.userId },
            mfaChallenge(payload.userId, user.email, user.preferredLocale),
          )
        }),

      "auth.requestPasswordReset": (payload) =>
        sql.withTransaction(requestPasswordReset(payload.email)).pipe(dieOnSqlError),

      "auth.resetPassword": (payload) =>
        Effect.gen(function* () {
          const found = yield* users.findCredentialsByEmail(payload.email).pipe(dieOnSqlError)
          if (Option.isNone(found)) {
            return yield* Effect.fail(new TokenInvalid({ reason: "not_found" }))
          }
          const userId = found.value.id
          yield* sql
            .withTransaction(
              resetPassword({
                userId,
                code: payload.code,
                newPassword: payload.newPassword,
                revokeOtherSessions: payload.revokeOtherSessions,
              }),
            )
            .pipe(dieOnSqlError)
        }),

      "auth.me": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const found = yield* users.findById(currentUser.userId).pipe(dieOnSqlError)
          const user = yield* dieIfMissing(found)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            preferredLocale: user.preferredLocale,
            emailVerified: user.emailVerified,
            mfaEnabled: user.mfaEnabled,
          }
        }),

      "auth.mfaEnroll": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const found = yield* users.findById(currentUser.userId).pipe(dieOnSqlError)
          const user = yield* dieIfMissing(found)
          return yield* mfaEnroll(currentUser.userId, user.email).pipe(
            dieOnSqlError,
            Effect.catchTag("UserNotFound", (error) => Effect.die(error)),
          )
        }),

      "auth.mfaConfirmEnroll": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          yield* mfaConfirmEnroll(currentUser.userId, payload.code).pipe(dieOnSqlError)
        }),

      "auth.mfaDisable": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          yield* mfaDisable(currentUser.userId).pipe(dieOnSqlError)
        }),

      "auth.listSessions": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const sessions = yield* listSessions(currentUser.userId).pipe(dieOnSqlError)
          return sessions.map((session) => ({
            id: session.id,
            deviceLabel: session.deviceLabel,
            mfaTrustedUntil: session.mfaTrustedUntil,
            expiresAt: session.expiresAt,
            createdAt: session.createdAt,
          }))
        }),

      "auth.revokeSession": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          yield* revokeSession(currentUser.userId, payload.sessionId).pipe(dieOnSqlError)
        }),

      "auth.revokeAllSessions": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          yield* revokeAllSessions(currentUser.userId).pipe(dieOnSqlError)
        }),
    }
  }),
)
