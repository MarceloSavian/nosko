import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { UserSettings } from "./UserSettings"

describe("UserSettings", () => {
  it("decodes a row with no personal cap set", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(UserSettings)({
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        personalSpendCapMinor: null,
        currency: "EUR",
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    )
    expect(decoded.personalSpendCapMinor).toBeNull()
  })

  it("decodes a row with a personal cap set", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(UserSettings)({
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        personalSpendCapMinor: 95000,
        currency: "EUR",
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    )
    expect(decoded.personalSpendCapMinor).toBe(95000)
  })
})
