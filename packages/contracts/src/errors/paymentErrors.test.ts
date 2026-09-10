import { describe, expect, it } from "@jest/globals"
import { NoCycleForDate, SharedAccountRequired, SharedPaymentNotFound } from "./paymentErrors"

describe("payment errors", () => {
  it("carries no payload on SharedPaymentNotFound", () => {
    expect(new SharedPaymentNotFound({})._tag).toBe("SharedPaymentNotFound")
  })

  it("carries no payload on SharedAccountRequired", () => {
    expect(new SharedAccountRequired({})._tag).toBe("SharedAccountRequired")
  })

  it("carries no payload on NoCycleForDate", () => {
    expect(new NoCycleForDate({})._tag).toBe("NoCycleForDate")
  })
})
