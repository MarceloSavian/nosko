import { describe, expect, it } from "@jest/globals"
import { Effect } from "effect"
import { OpaqueTokensLive } from "../../infra/auth/OpaqueTokens"
import { TotpServiceLive } from "../../infra/auth/TotpService"
import { makeFakeMailer } from "../../test/fakeMailer"
import { makeFakeAuthTokensRepository, makeFakeUsersRepository } from "../../test/fakeRepositories"
import { mfaChallenge, mfaConfirmEnroll, mfaDisable, mfaEnroll } from "./Mfa"

const seedUser = () => ({
  id: "user-1",
  email: "marcelo@example.com",
  passwordHash: "hash",
  emailVerified: true,
  mfaEnabled: false,
  mfaSecret: null,
})

describe("mfaEnroll", () => {
  it("generates a secret and stores it disabled until confirmed", async () => {
    const { layer, users } = makeFakeUsersRepository([seedUser()])

    const enrollment = await Effect.runPromise(
      mfaEnroll("user-1", "marcelo@example.com").pipe(
        Effect.provide(layer),
        Effect.provide(TotpServiceLive),
      ),
    )

    expect(enrollment.secret).toMatch(/^[A-Z2-7]+$/)
    expect(enrollment.enrollmentUri).toContain("otpauth://totp/")
    expect(users.get("user-1")?.mfaSecret).toBe(enrollment.secret)
    expect(users.get("user-1")?.mfaEnabled).toBe(false)
  })

  it("fails with UserNotFound for an unknown user", async () => {
    const { layer } = makeFakeUsersRepository()

    const exit = await Effect.runPromiseExit(
      mfaEnroll("missing", "x@example.com").pipe(
        Effect.provide(layer),
        Effect.provide(TotpServiceLive),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("fails with MfaAlreadyEnabled when MFA is already on", async () => {
    const { layer } = makeFakeUsersRepository([{ ...seedUser(), mfaEnabled: true }])

    const exit = await Effect.runPromiseExit(
      mfaEnroll("user-1", "marcelo@example.com").pipe(
        Effect.provide(layer),
        Effect.provide(TotpServiceLive),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })
})

describe("mfaConfirmEnroll", () => {
  it("enables MFA once the correct code is entered", async () => {
    const { layer, users } = makeFakeUsersRepository([seedUser()])

    const enrollment = await Effect.runPromise(
      mfaEnroll("user-1", "marcelo@example.com").pipe(
        Effect.provide(layer),
        Effect.provide(TotpServiceLive),
      ),
    )

    const { TOTP, Secret } = await import("otpauth")
    const code = new TOTP({ secret: Secret.fromBase32(enrollment.secret) }).generate()

    await Effect.runPromise(
      mfaConfirmEnroll("user-1", code).pipe(Effect.provide(layer), Effect.provide(TotpServiceLive)),
    )

    expect(users.get("user-1")?.mfaEnabled).toBe(true)
  })

  it("fails with MfaCodeInvalid for a wrong code", async () => {
    const { layer } = makeFakeUsersRepository([seedUser()])

    await Effect.runPromise(
      mfaEnroll("user-1", "marcelo@example.com").pipe(
        Effect.provide(layer),
        Effect.provide(TotpServiceLive),
      ),
    )

    const exit = await Effect.runPromiseExit(
      mfaConfirmEnroll("user-1", "000000").pipe(
        Effect.provide(layer),
        Effect.provide(TotpServiceLive),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("fails with MfaCodeInvalid when no enrollment is pending", async () => {
    const { layer } = makeFakeUsersRepository([seedUser()])

    const exit = await Effect.runPromiseExit(
      mfaConfirmEnroll("user-1", "123456").pipe(
        Effect.provide(layer),
        Effect.provide(TotpServiceLive),
      ),
    )

    expect(exit._tag).toBe("Failure")
  })
})

describe("mfaDisable", () => {
  it("clears the secret and disables MFA", async () => {
    const { layer, users } = makeFakeUsersRepository([
      { ...seedUser(), mfaEnabled: true, mfaSecret: "SOMESECRET" },
    ])

    await Effect.runPromise(mfaDisable("user-1").pipe(Effect.provide(layer)))

    expect(users.get("user-1")?.mfaEnabled).toBe(false)
    expect(users.get("user-1")?.mfaSecret).toBeNull()
  })
})

describe("mfaChallenge", () => {
  it("creates an OTP token and emails it", async () => {
    const { layer: authTokensLayer, tokens } = makeFakeAuthTokensRepository()
    const { layer: mailerLayer, sent } = makeFakeMailer()

    await Effect.runPromise(
      mfaChallenge("user-1", "marcelo@example.com", "pt-BR").pipe(
        Effect.provide(authTokensLayer),
        Effect.provide(mailerLayer),
        Effect.provide(OpaqueTokensLive),
      ),
    )

    expect(tokens.size).toBe(1)
    expect(sent).toHaveLength(1)
    expect(sent[0]?.to).toBe("marcelo@example.com")
  })
})
