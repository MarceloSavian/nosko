import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { Household, HouseholdMember, HouseholdSettings, NewHousehold } from "./Household"

const now = new Date("2026-01-01T00:00:00.000Z")

describe("Household", () => {
  it("decodes a database row", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(Household)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        name: "Casa Marcelo & Gabriele",
        baseCurrency: "EUR",
        createdBy: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        createdAt: now,
        updatedAt: now,
      }),
    )
    expect(decoded.name).toBe("Casa Marcelo & Gabriele")
  })
})

describe("NewHousehold", () => {
  it("decodes creation input", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(NewHousehold)({
        name: "Casa",
        baseCurrency: "EUR",
        createdBy: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
      }),
    )
    expect(decoded.baseCurrency).toBe("EUR")
  })
})

describe("HouseholdSettings", () => {
  it("decodes a database row", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(HouseholdSettings)({
        householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        cycleAnchorDay: 23,
        locale: "pt-BR",
        baseCurrency: "EUR",
        defaultReserveMinor: 10000,
        box3AllowanceMinor: 5700000,
        box3Rate: 0.0216,
        inflationRate: 0,
        updatedAt: now,
      }),
    )
    expect(decoded.cycleAnchorDay).toBe(23)
  })
})

describe("HouseholdMember", () => {
  it("decodes a member with a null display name", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(HouseholdMember)({
        householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        role: "owner",
        displayName: null,
        joinedAt: now,
      }),
    )
    expect(decoded.role).toBe("owner")
    expect(decoded.displayName).toBeNull()
  })

  it("rejects a role outside the owner/member union", async () => {
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(HouseholdMember)({
        householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        role: "guest",
        displayName: null,
        joinedAt: now,
      }),
    )
    expect(exit._tag).toBe("Failure")
  })
})
