import { describe, expect, it } from "@jest/globals"
import { NoFxRate } from "./fxErrors"

describe("NoFxRate", () => {
  it("carries the base and quote currencies", () => {
    const error = new NoFxRate({ base: "EUR", quote: "BRL" })
    expect(error._tag).toBe("NoFxRate")
    expect(error.base).toBe("EUR")
    expect(error.quote).toBe("BRL")
  })
})
