import { describe, expect, it } from "@jest/globals"
import {
  EmailAlreadyRegistered,
  EmailNotVerified,
  InvalidCredentials,
  MfaAlreadyEnabled,
  MfaCodeInvalid,
  SessionInvalid,
  TokenInvalid,
  UserNotFound,
} from "./authErrors"

describe("auth errors", () => {
  it("carries the email on EmailAlreadyRegistered", () => {
    const error = new EmailAlreadyRegistered({ email: "marcelo@example.com" })
    expect(error._tag).toBe("EmailAlreadyRegistered")
    expect(error.email).toBe("marcelo@example.com")
  })

  it("carries no payload on InvalidCredentials", () => {
    const error = new InvalidCredentials({})
    expect(error._tag).toBe("InvalidCredentials")
  })

  it("carries the user id on EmailNotVerified", () => {
    const error = new EmailNotVerified({ userId: "user-1" })
    expect(error.userId).toBe("user-1")
  })

  it("carries the reason on TokenInvalid", () => {
    const error = new TokenInvalid({ reason: "expired" })
    expect(error.reason).toBe("expired")
  })

  it("carries no payload on MfaCodeInvalid", () => {
    const error = new MfaCodeInvalid({})
    expect(error._tag).toBe("MfaCodeInvalid")
  })

  it("carries no payload on MfaAlreadyEnabled", () => {
    const error = new MfaAlreadyEnabled({})
    expect(error._tag).toBe("MfaAlreadyEnabled")
  })

  it("carries the reason on SessionInvalid", () => {
    const error = new SessionInvalid({ reason: "revoked" })
    expect(error.reason).toBe("revoked")
  })

  it("carries the user id on UserNotFound", () => {
    const error = new UserNotFound({ userId: "user-1" })
    expect(error.userId).toBe("user-1")
  })
})
