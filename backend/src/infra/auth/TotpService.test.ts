import { describe, expect, it } from "@jest/globals"
import { Effect } from "effect"
import { Secret, TOTP } from "otpauth"
import { TotpService, TotpServiceLive } from "./TotpService"

const run = <A>(effect: Effect.Effect<A, never, TotpService>) =>
  Effect.runSync(effect.pipe(Effect.provide(TotpServiceLive)))

describe("TotpServiceLive", () => {
  it("generates a base32 secret", () => {
    const secret = run(
      Effect.gen(function* () {
        const totp = yield* TotpService
        return totp.generateSecret()
      }),
    )
    expect(secret).toMatch(/^[A-Z2-7]+$/)
  })

  it("builds an otpauth:// enrollment URI", () => {
    const uri = run(
      Effect.gen(function* () {
        const totp = yield* TotpService
        const secret = totp.generateSecret()
        return totp.enrollmentUri(secret, "marcelo@example.com")
      }),
    )
    expect(uri.startsWith("otpauth://totp/")).toBe(true)
    expect(uri).toContain("marcelo%40example.com")
  })

  it("verifies a code generated from the same secret", () => {
    const { secret, ok } = run(
      Effect.gen(function* () {
        const totp = yield* TotpService
        const secretBase32 = totp.generateSecret()
        const code = new TOTP({
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: Secret.fromBase32(secretBase32),
        }).generate()
        return { secret: secretBase32, ok: totp.verifyCode(secretBase32, code) }
      }),
    )
    expect(secret).toBeDefined()
    expect(ok).toBe(true)
  })

  it("rejects an incorrect code", () => {
    const ok = run(
      Effect.gen(function* () {
        const totp = yield* TotpService
        const secret = totp.generateSecret()
        const wrongCode = new TOTP({
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: Secret.fromBase32(secret),
        }).generate({ timestamp: Date.now() + 10 * 60 * 1000 })
        return totp.verifyCode(secret, wrongCode)
      }),
    )
    expect(ok).toBe(false)
  })
})
