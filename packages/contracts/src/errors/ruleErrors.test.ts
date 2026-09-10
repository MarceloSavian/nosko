import { describe, expect, it } from "@jest/globals"
import { RecurringRuleNotFound } from "./ruleErrors"

describe("rule errors", () => {
  it("carries no payload on RecurringRuleNotFound", () => {
    expect(new RecurringRuleNotFound({})._tag).toBe("RecurringRuleNotFound")
  })
})
