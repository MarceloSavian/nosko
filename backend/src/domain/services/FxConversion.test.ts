import { describe, expect, it } from "@jest/globals"
import { money } from "@nosko/contracts"
import { Effect } from "effect"
import { convertToBase } from "./FxConversion"

describe("convertToBase", () => {
  it("returns the amount unchanged, with rate 1, when already in the base currency", async () => {
    const result = await Effect.runPromise(convertToBase(money(1000, "EUR"), "EUR", null))
    expect(result).toEqual({ amountBase: { amountMinor: 1000, currency: "EUR" }, rate: 1 })
  })

  it("converts using the given rate when the currency differs from the base", async () => {
    const result = await Effect.runPromise(
      convertToBase(money(54300, "BRL"), "EUR", { rate: 5.43 }),
    )
    expect(result.amountBase).toEqual({ amountMinor: 10000, currency: "EUR" })
    expect(result.rate).toBe(5.43)
  })

  it("fails with NoFxRate when the currency differs and no rate is given", async () => {
    const error = await Effect.runPromise(
      Effect.flip(convertToBase(money(54300, "BRL"), "EUR", null)),
    )
    expect(error._tag).toBe("NoFxRate")
    expect(error.base).toBe("EUR")
    expect(error.quote).toBe("BRL")
  })
})
