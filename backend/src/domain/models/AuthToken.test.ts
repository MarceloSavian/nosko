import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { AuthToken } from "./AuthToken"

const now = new Date("2026-01-01T00:00:00.000Z")

describe("AuthToken", () => {
  it("decodes a row, stripping the token hash", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(AuthToken)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        type: "email_verify",
        tokenHash: "sha256-hash",
        expiresAt: now,
        consumedAt: null,
        createdAt: now,
      }),
    )
    expect(decoded.type).toBe("email_verify")
    expect(decoded.consumedAt).toBeNull()
    expect(decoded).not.toHaveProperty("tokenHash")
  })

  it("rejects a type outside the known set", async () => {
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(AuthToken)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        type: "sms_otp",
        expiresAt: now,
        consumedAt: null,
        createdAt: now,
      }),
    )
    expect(exit._tag).toBe("Failure")
  })
})
