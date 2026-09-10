import { Secret, TOTP } from "otpauth"

// Matches backend/src/infra/auth/TotpService.ts's makeTotp exactly (issuer, algorithm, digits,
// period) so a code generated here validates against the server's window: 1 check.
export const generateTotpCode = (secretBase32: string): string =>
  new TOTP({
    issuer: "nosko",
    label: "e2e",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  }).generate()
