import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { RecurringRuleView, RulesRpcs } from "./rules"

const baseRule = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  matchType: "vendor_exact",
  matcher: "netflix",
  expectedAmountMinor: 10_000,
  currency: "EUR",
  categoryId: null,
  cadence: "monthly",
  isFixedBill: true,
  active: true,
  source: "user_defined",
  confidence: null,
}

describe("RecurringRuleView", () => {
  it("decodes a wire-shaped rule", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(RecurringRuleView)(baseRule))
    expect(decoded.matcher).toBe("netflix")
  })
})

describe("RulesRpcs", () => {
  it("declares every recurring-rule action shipped in U6", () => {
    expect([...RulesRpcs.requests.keys()]).toEqual([
      "rules.list",
      "rules.create",
      "rules.update",
      "rules.deactivate",
    ])
  })
})
