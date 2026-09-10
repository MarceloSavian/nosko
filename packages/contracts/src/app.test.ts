import { describe, expect, it } from "@jest/globals"
import { AppRpcs } from "./app"

describe("AppRpcs", () => {
  it("merges every auth and household action into one group", () => {
    expect(AppRpcs.requests.size).toBe(21)
    expect(AppRpcs.requests.has("auth.signUp")).toBe(true)
    expect(AppRpcs.requests.has("household.create")).toBe(true)
  })
})
