import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { UserSession } from "./UserSession"

const now = new Date("2026-01-01T00:00:00.000Z")

describe("UserSession", () => {
  it("decodes an active session without a trusted-device window", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(UserSession)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        deviceLabel: null,
        mfaTrustedUntil: null,
        expiresAt: now,
        revokedAt: null,
        createdAt: now,
      }),
    )
    expect(decoded.mfaTrustedUntil).toBeNull()
    expect(decoded.revokedAt).toBeNull()
  })

  it("decodes a remembered-device session with a device label", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(UserSession)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        deviceLabel: "Chrome on macOS",
        mfaTrustedUntil: now,
        expiresAt: now,
        revokedAt: now,
        createdAt: now,
      }),
    )
    expect(decoded.deviceLabel).toBe("Chrome on macOS")
    expect(decoded.revokedAt).not.toBeNull()
  })
})
