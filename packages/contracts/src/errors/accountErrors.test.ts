import { describe, expect, it } from "@jest/globals"
import { AccountNotFound, JointAccountVisibilityLocked } from "./accountErrors"

describe("account errors", () => {
  it("carries no payload on AccountNotFound", () => {
    const error = new AccountNotFound({})
    expect(error._tag).toBe("AccountNotFound")
  })

  it("carries no payload on JointAccountVisibilityLocked", () => {
    const error = new JointAccountVisibilityLocked({})
    expect(error._tag).toBe("JointAccountVisibilityLocked")
  })
})
