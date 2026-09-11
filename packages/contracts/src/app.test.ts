import { describe, expect, it } from "@jest/globals"
import { AppRpcs } from "./app"

describe("AppRpcs", () => {
  it("merges every auth, household, account, cycle, bill, rule, payment, category, and ingestion action into one group", () => {
    expect(AppRpcs.requests.size).toBe(64)
    expect(AppRpcs.requests.has("auth.signUp")).toBe(true)
    expect(AppRpcs.requests.has("household.create")).toBe(true)
    expect(AppRpcs.requests.has("accounts.list")).toBe(true)
    expect(AppRpcs.requests.has("cycles.list")).toBe(true)
    expect(AppRpcs.requests.has("bills.list")).toBe(true)
    expect(AppRpcs.requests.has("rules.list")).toBe(true)
    expect(AppRpcs.requests.has("payments.list")).toBe(true)
    expect(AppRpcs.requests.has("categories.list")).toBe(true)
    expect(AppRpcs.requests.has("ingestion.upload")).toBe(true)
  })
})
