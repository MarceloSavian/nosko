import { describe, expect, it } from "@jest/globals"
import { HouseholdFull, InvitationInvalid, NoHousehold, NotHouseholdOwner } from "./householdErrors"

describe("household errors", () => {
  it("carries the household id on HouseholdFull", () => {
    const error = new HouseholdFull({ householdId: "household-1" })
    expect(error._tag).toBe("HouseholdFull")
    expect(error.householdId).toBe("household-1")
  })

  it("carries the reason on InvitationInvalid", () => {
    const error = new InvitationInvalid({ reason: "email_mismatch" })
    expect(error.reason).toBe("email_mismatch")
  })

  it("carries no payload on NotHouseholdOwner", () => {
    const error = new NotHouseholdOwner({})
    expect(error._tag).toBe("NotHouseholdOwner")
  })

  it("carries no payload on NoHousehold", () => {
    const error = new NoHousehold({})
    expect(error._tag).toBe("NoHousehold")
  })
})
