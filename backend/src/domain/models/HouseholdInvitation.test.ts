import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { HouseholdInvitation } from "./HouseholdInvitation"

const now = new Date("2026-01-01T00:00:00.000Z")

describe("HouseholdInvitation", () => {
  it("decodes a pending invitation, stripping the token hash", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(HouseholdInvitation)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        email: "gabriele@example.com",
        tokenHash: "sha256-hash",
        invitedBy: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
        status: "pending",
        expiresAt: now,
        acceptedBy: null,
        createdAt: now,
      }),
    )
    expect(decoded.status).toBe("pending")
    expect(decoded.acceptedBy).toBeNull()
    expect(decoded).not.toHaveProperty("tokenHash")
  })

  it("decodes an accepted invitation", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(HouseholdInvitation)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        email: "gabriele@example.com",
        invitedBy: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
        status: "accepted",
        expiresAt: now,
        acceptedBy: "8c9e6679-7425-40de-944b-e07fc1f90aea",
        createdAt: now,
      }),
    )
    expect(decoded.status).toBe("accepted")
    expect(decoded.acceptedBy).toBe("8c9e6679-7425-40de-944b-e07fc1f90aea")
  })
})
