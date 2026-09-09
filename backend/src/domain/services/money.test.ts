import { describe, expect, it } from "@jest/globals"
import { money } from "@nosko/contracts"
import { Effect } from "effect"
import { CurrencyMismatch } from "../errors/CurrencyMismatch"
import { addMoney } from "./money"

describe("addMoney", () => {
  it("adds two amounts in the same currency", async () => {
    const result = await Effect.runPromise(addMoney(money(1000, "EUR"), money(250, "EUR")))
    expect(result).toEqual({ amountMinor: 1250, currency: "EUR" })
  })

  it("fails with CurrencyMismatch on different currencies", async () => {
    const error = await Effect.runPromise(
      Effect.flip(addMoney(money(1000, "EUR"), money(250, "BRL"))),
    )
    expect(error).toBeInstanceOf(CurrencyMismatch)
    expect(error.left).toBe("EUR")
    expect(error.right).toBe("BRL")
  })
})
