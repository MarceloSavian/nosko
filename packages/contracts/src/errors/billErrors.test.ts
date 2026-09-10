import { describe, expect, it } from "@jest/globals"
import { FixedBillNotFound } from "./billErrors"

describe("bill errors", () => {
  it("carries no payload on FixedBillNotFound", () => {
    expect(new FixedBillNotFound({})._tag).toBe("FixedBillNotFound")
  })
})
