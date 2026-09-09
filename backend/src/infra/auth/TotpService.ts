import { Context, Layer } from "effect"
import { Secret, TOTP } from "otpauth"

export class TotpService extends Context.Tag("TotpService")<
  TotpService,
  {
    readonly generateSecret: () => string
    readonly enrollmentUri: (secretBase32: string, accountLabel: string) => string
    readonly verifyCode: (secretBase32: string, code: string) => boolean
  }
>() {}

const makeTotp = (secretBase32: string, accountLabel: string) =>
  new TOTP({
    issuer: "nosko",
    label: accountLabel,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  })

export const TotpServiceLive = Layer.succeed(TotpService, {
  generateSecret: () => new Secret({ size: 20 }).base32,
  enrollmentUri: (secretBase32, accountLabel) => makeTotp(secretBase32, accountLabel).toString(),
  verifyCode: (secretBase32, code) =>
    makeTotp(secretBase32, "").validate({ token: code, window: 1 }) !== null,
})
