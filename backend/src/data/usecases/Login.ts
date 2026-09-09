import { DateTime, Effect, Option } from "effect"
import {
  EmailNotVerified,
  InvalidCredentials,
  MfaCodeInvalid,
} from "../../domain/errors/AuthErrors"
import { OpaqueTokens } from "../../infra/auth/OpaqueTokens"
import { PasswordHasher } from "../../infra/auth/PasswordHasher"
import { TotpService } from "../../infra/auth/TotpService"
import { AuthTokensRepository } from "../protocols/AuthTokensRepository"
import { UserSessionsRepository } from "../protocols/UserSessionsRepository"
import { UsersRepository } from "../protocols/UsersRepository"
import { type IssuedSession, issueSession } from "./Sessions"

const MFA_TRUST_MS = 30 * 24 * 60 * 60 * 1000

export interface LoginInput {
  readonly email: string
  readonly password: string
  readonly deviceToken?: string
}

export type LoginResult =
  | { readonly status: "mfa_required"; readonly userId: string }
  | ({ readonly status: "authenticated" } & IssuedSession)

const isDeviceStillTrusted = (mfaTrustedUntil: DateTime.Utc | null): boolean =>
  mfaTrustedUntil !== null && DateTime.toEpochMillis(mfaTrustedUntil) > Date.now()

export const login = (input: LoginInput) =>
  Effect.gen(function* () {
    const users = yield* UsersRepository
    const hasher = yield* PasswordHasher
    const sessions = yield* UserSessionsRepository
    const opaqueTokens = yield* OpaqueTokens

    const found = yield* users.findCredentialsByEmail(input.email)
    if (Option.isNone(found)) {
      return yield* Effect.fail(new InvalidCredentials({}))
    }
    const credentials = found.value

    const passwordOk = yield* hasher.verify(input.password, credentials.passwordHash)
    if (!passwordOk) {
      return yield* Effect.fail(new InvalidCredentials({}))
    }

    if (!credentials.emailVerified) {
      return yield* Effect.fail(new EmailNotVerified({ userId: credentials.id }))
    }

    if (!credentials.mfaEnabled) {
      const issued = yield* issueSession({
        userId: credentials.id,
        deviceLabel: null,
        mfaTrustedUntil: null,
      })
      return { status: "authenticated" as const, ...issued }
    }

    if (input.deviceToken) {
      const deviceHash = opaqueTokens.hash(input.deviceToken)
      const trusted = yield* sessions.findByRefreshTokenHash(credentials.id, deviceHash)
      if (Option.isSome(trusted) && isDeviceStillTrusted(trusted.value.mfaTrustedUntil)) {
        const issued = yield* issueSession({
          userId: credentials.id,
          deviceLabel: null,
          mfaTrustedUntil: new Date(Date.now() + MFA_TRUST_MS),
        })
        return { status: "authenticated" as const, ...issued }
      }
    }

    return { status: "mfa_required" as const, userId: credentials.id }
  })

export interface MfaVerifyInput {
  readonly userId: string
  readonly code: string
  readonly rememberDevice: boolean
}

export const mfaVerify = (input: MfaVerifyInput) =>
  Effect.gen(function* () {
    const users = yield* UsersRepository
    const totp = yield* TotpService
    const opaqueTokens = yield* OpaqueTokens
    const authTokens = yield* AuthTokensRepository

    const found = yield* users.findCredentialsById(input.userId)
    if (Option.isNone(found) || !found.value.mfaEnabled) {
      return yield* Effect.fail(new MfaCodeInvalid({}))
    }
    const credentials = found.value

    const viaTotp =
      credentials.mfaSecret !== null && totp.verifyCode(credentials.mfaSecret, input.code)

    let verified = viaTotp
    if (!verified) {
      const hash = opaqueTokens.hash(input.code)
      const otpToken = yield* authTokens.findValid(input.userId, "mfa_otp", hash)
      if (Option.isSome(otpToken)) {
        yield* authTokens.consume(otpToken.value.id)
        verified = true
      }
    }

    if (!verified) {
      return yield* Effect.fail(new MfaCodeInvalid({}))
    }

    const mfaTrustedUntil = input.rememberDevice ? new Date(Date.now() + MFA_TRUST_MS) : null
    const issued = yield* issueSession({
      userId: input.userId,
      deviceLabel: null,
      mfaTrustedUntil,
    })
    return { status: "authenticated" as const, ...issued }
  })
