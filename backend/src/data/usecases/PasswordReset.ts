import { Effect, Option } from "effect"
import { TokenInvalid } from "../../domain/errors/AuthErrors"
import { OpaqueTokens } from "../../infra/auth/OpaqueTokens"
import { PasswordHasher } from "../../infra/auth/PasswordHasher"
import { passwordResetEmail } from "../../infra/mailer/EmailTemplates"
import { Mailer } from "../../infra/mailer/Mailer"
import { AuthTokensRepository } from "../protocols/AuthTokensRepository"
import { UserSessionsRepository } from "../protocols/UserSessionsRepository"
import { UsersRepository } from "../protocols/UsersRepository"

const RESET_TTL_MS = 15 * 60 * 1000

export const requestPasswordReset = (email: string) =>
  Effect.gen(function* () {
    const users = yield* UsersRepository
    const opaqueTokens = yield* OpaqueTokens
    const authTokens = yield* AuthTokensRepository
    const mailer = yield* Mailer

    const found = yield* users.findCredentialsByEmail(email)
    if (Option.isNone(found)) {
      return
    }
    const credentials = found.value

    const { code, hash } = opaqueTokens.generateCode()
    yield* authTokens.create({
      userId: credentials.id,
      type: "password_reset",
      tokenHash: hash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    })

    yield* mailer
      .send({ to: email, ...passwordResetEmail(credentials.preferredLocale, code) })
      .pipe(Effect.ignore)
  })

export interface ResetPasswordInput {
  readonly userId: string
  readonly code: string
  readonly newPassword: string
  readonly revokeOtherSessions: boolean
}

export const resetPassword = (input: ResetPasswordInput) =>
  Effect.gen(function* () {
    const users = yield* UsersRepository
    const hasher = yield* PasswordHasher
    const authTokens = yield* AuthTokensRepository
    const opaqueTokens = yield* OpaqueTokens
    const sessions = yield* UserSessionsRepository

    const hash = opaqueTokens.hash(input.code)
    const found = yield* authTokens.findValid(input.userId, "password_reset", hash)
    if (Option.isNone(found)) {
      return yield* Effect.fail(new TokenInvalid({ reason: "not_found" }))
    }

    yield* authTokens.consume(found.value.id)

    const passwordHash = yield* hasher.hash(input.newPassword)
    yield* users.setPasswordHash(input.userId, passwordHash)

    if (input.revokeOtherSessions) {
      yield* sessions.revokeAllForUser(input.userId)
    }
  })
