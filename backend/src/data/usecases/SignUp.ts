import { Effect, Option } from "effect"
import { EmailAlreadyRegistered, TokenInvalid, UserNotFound } from "../../domain/errors/AuthErrors"
import type { Locale } from "../../domain/models/Locale"
import { OpaqueTokens } from "../../infra/auth/OpaqueTokens"
import { PasswordHasher } from "../../infra/auth/PasswordHasher"
import { verificationEmail } from "../../infra/mailer/EmailTemplates"
import { Mailer } from "../../infra/mailer/Mailer"
import { AuthTokensRepository } from "../protocols/AuthTokensRepository"
import { UsersRepository } from "../protocols/UsersRepository"

const VERIFICATION_TTL_MS = 15 * 60 * 1000

const sendVerificationCode = (userId: string, email: string, locale: Locale) =>
  Effect.gen(function* () {
    const opaqueTokens = yield* OpaqueTokens
    const authTokens = yield* AuthTokensRepository
    const mailer = yield* Mailer

    const { code, hash } = opaqueTokens.generateCode()
    yield* authTokens.create({
      userId,
      type: "email_verify",
      tokenHash: hash,
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    })

    yield* mailer.send({ to: email, ...verificationEmail(locale, code) }).pipe(Effect.ignore)
  })

export interface SignUpInput {
  readonly name: string
  readonly email: string
  readonly password: string
  readonly preferredLocale: Locale
}

export const signUp = (input: SignUpInput) =>
  Effect.gen(function* () {
    const users = yield* UsersRepository
    const hasher = yield* PasswordHasher

    const existing = yield* users.findCredentialsByEmail(input.email)
    if (Option.isSome(existing)) {
      return yield* Effect.fail(new EmailAlreadyRegistered({ email: input.email }))
    }

    const passwordHash = yield* hasher.hash(input.password)
    const user = yield* users.create({
      email: input.email,
      passwordHash,
      name: input.name,
      preferredLocale: input.preferredLocale,
    })

    yield* sendVerificationCode(user.id, input.email, input.preferredLocale)

    return user
  })

export interface VerifyEmailInput {
  readonly userId: string
  readonly code: string
}

export const verifyEmail = (input: VerifyEmailInput) =>
  Effect.gen(function* () {
    const users = yield* UsersRepository
    const authTokens = yield* AuthTokensRepository
    const opaqueTokens = yield* OpaqueTokens

    const hash = opaqueTokens.hash(input.code)
    const found = yield* authTokens.findValid(input.userId, "email_verify", hash)
    if (Option.isNone(found)) {
      return yield* Effect.fail(new TokenInvalid({ reason: "not_found" }))
    }

    yield* authTokens.consume(found.value.id)
    yield* users.setEmailVerified(input.userId)
  })

export const resendVerification = (userId: string) =>
  Effect.gen(function* () {
    const users = yield* UsersRepository

    const found = yield* users.findById(userId)
    if (Option.isNone(found)) {
      return yield* Effect.fail(new UserNotFound({ userId }))
    }

    yield* sendVerificationCode(userId, found.value.email, found.value.preferredLocale)
  })
