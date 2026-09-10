import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import {
  HouseholdInvitationView,
  HouseholdMemberView,
  HouseholdRpcs,
  HouseholdView,
} from "./household"

describe("HouseholdView", () => {
  it("decodes a wire-shaped household", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(HouseholdView)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        name: "Casa Marcelo & Gabriele",
        baseCurrency: "EUR",
      }),
    )
    expect(decoded.baseCurrency).toBe("EUR")
  })
})

describe("HouseholdMemberView", () => {
  it("decodes a wire-shaped member", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(HouseholdMemberView)({
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        role: "owner",
        displayName: null,
      }),
    )
    expect(decoded.role).toBe("owner")
  })
})

describe("HouseholdInvitationView", () => {
  it("decodes a wire-shaped invitation", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(HouseholdInvitationView)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        email: "gabriele@example.com",
        status: "pending",
        expiresAt: "2026-02-01T00:00:00.000Z",
      }),
    )
    expect(decoded.status).toBe("pending")
  })
})

describe("HouseholdRpcs", () => {
  it("declares every household action from the user stories", () => {
    expect([...HouseholdRpcs.requests.keys()]).toEqual([
      "household.create",
      "household.get",
      "household.update",
      "household.invite",
      "household.listInvitations",
      "household.revokeInvitation",
      "household.acceptInvitation",
      "household.listMembers",
      "household.removeMember",
    ])
  })
})
