import { describe, expect, it } from "@jest/globals"
import { CurrencyMismatch } from "./currencyMismatch"

describe("CurrencyMismatch", () => {
  it("carries the mismatched currencies", () => {
    const error = new CurrencyMismatch({ left: "EUR", right: "BRL" })
    expect(error._tag).toBe("CurrencyMismatch")
    expect(error.left).toBe("EUR")
    expect(error.right).toBe("BRL")
  })
})
