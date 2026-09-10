import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { AuthRpcs, AuthUserView, MfaEnrollmentView, SessionView } from "./auth"

describe("AuthUserView", () => {
  it("decodes a wire-shaped auth user", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(AuthUserView)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        email: "marcelo@example.com",
        name: "Marcelo",
        preferredLocale: "pt-BR",
        emailVerified: true,
        mfaEnabled: false,
      }),
    )
    expect(decoded.email).toBe("marcelo@example.com")
  })
})

describe("MfaEnrollmentView", () => {
  it("decodes a secret and enrollment uri", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(MfaEnrollmentView)({
        secret: "base32secret",
        enrollmentUri: "otpauth://totp/nosko:marcelo@example.com?secret=base32secret",
      }),
    )
    expect(decoded.secret).toBe("base32secret")
  })
})

describe("SessionView", () => {
  it("decodes ISO date strings for the wire", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(SessionView)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        deviceLabel: null,
        mfaTrustedUntil: null,
        expiresAt: "2026-02-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    )
    expect(decoded.deviceLabel).toBeNull()
  })
})

describe("AuthRpcs", () => {
  it("declares every auth action from the user stories", () => {
    expect([...AuthRpcs.requests.keys()]).toEqual([
      "auth.signUp",
      "auth.verifyEmail",
      "auth.resendVerification",
      "auth.mfaChallenge",
      "auth.requestPasswordReset",
      "auth.resetPassword",
      "auth.me",
      "auth.mfaEnroll",
      "auth.mfaConfirmEnroll",
      "auth.mfaDisable",
      "auth.listSessions",
      "auth.revokeSession",
      "auth.revokeAllSessions",
    ])
  })
})
