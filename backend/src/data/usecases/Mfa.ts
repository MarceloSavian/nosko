import { Effect, Option } from "effect"
import { MfaAlreadyEnabled, MfaCodeInvalid, UserNotFound } from "../../domain/errors/AuthErrors"
import type { Locale } from "../../domain/models/Locale"
import { OpaqueTokens } from "../../infra/auth/OpaqueTokens"
import { TotpService } from "../../infra/auth/TotpService"
import { mfaOtpEmail } from "../../infra/mailer/EmailTemplates"
import { Mailer } from "../../infra/mailer/Mailer"
import { AuthTokensRepository } from "../protocols/AuthTokensRepository"
import { UsersRepository } from "../protocols/UsersRepository"

const MFA_OTP_TTL_MS = 5 * 60 * 1000

export interface MfaEnrollment {
  readonly secret: string
  readonly enrollmentUri: string
}

export const mfaEnroll = (userId: string, accountEmail: string) =>
  Effect.gen(function* () {
    const users = yield* UsersRepository
    const totp = yield* TotpService

    const found = yield* users.findCredentialsById(userId)
    if (Option.isNone(found)) {
      return yield* Effect.fail(new UserNotFound({ userId }))
    }
    if (found.value.mfaEnabled) {
      return yield* Effect.fail(new MfaAlreadyEnabled({}))
    }

    const secret = totp.generateSecret()
    yield* users.setMfa(userId, { secret, enabled: false })

    return { secret, enrollmentUri: totp.enrollmentUri(secret, accountEmail) }
  })

export const mfaConfirmEnroll = (userId: string, code: string) =>
  Effect.gen(function* () {
    const users = yield* UsersRepository
    const totp = yield* TotpService

    const found = yield* users.findCredentialsById(userId)
    if (Option.isNone(found) || found.value.mfaSecret === null) {
      return yield* Effect.fail(new MfaCodeInvalid({}))
    }

    if (!totp.verifyCode(found.value.mfaSecret, code)) {
      return yield* Effect.fail(new MfaCodeInvalid({}))
    }

    yield* users.setMfa(userId, { secret: found.value.mfaSecret, enabled: true })
  })

export const mfaDisable = (userId: string) =>
  Effect.gen(function* () {
    const users = yield* UsersRepository
    yield* users.setMfa(userId, { secret: null, enabled: false })
  })

export const mfaChallenge = (userId: string, email: string, locale: Locale) =>
  Effect.gen(function* () {
    const opaqueTokens = yield* OpaqueTokens
    const authTokens = yield* AuthTokensRepository
    const mailer = yield* Mailer

    const { code, hash } = opaqueTokens.generateCode()
    yield* authTokens.create({
      userId,
      type: "mfa_otp",
      tokenHash: hash,
      expiresAt: new Date(Date.now() + MFA_OTP_TTL_MS),
    })

    yield* mailer.send({ to: email, ...mfaOtpEmail(locale, code) }).pipe(Effect.ignore)
  })
