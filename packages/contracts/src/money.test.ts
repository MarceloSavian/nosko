import { describe, expect, it } from "@jest/globals"
import { Schema } from "effect"
import { Currency, Money, money } from "./money"

describe("Money", () => {
  it("constructs a Money value", () => {
    expect(money(1000, "EUR")).toEqual({ amountMinor: 1000, currency: "EUR" })
  })

  it("decodes a valid Money", () => {
    const decoded = Schema.decodeUnknownSync(Money)({ amountMinor: 500, currency: "BRL" })
    expect(decoded).toEqual({ amountMinor: 500, currency: "BRL" })
  })

  it("rejects an unknown currency", () => {
    const result = Schema.decodeUnknownEither(Money)({ amountMinor: 1, currency: "JPY" })
    expect(result._tag).toBe("Left")
  })

  it("rejects a non-integer amount", () => {
    const result = Schema.decodeUnknownEither(Money)({ amountMinor: 1.5, currency: "EUR" })
    expect(result._tag).toBe("Left")
  })

  it("guards the currency schema", () => {
    expect(Schema.is(Currency)("EUR")).toBe(true)
    expect(Schema.is(Currency)("XYZ")).toBe(false)
  })
})
