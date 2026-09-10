import { describe, expect, it } from "@jest/globals"
import { types } from "pg"
import { PgLive } from "./DatabaseConfig"

describe("PgLive", () => {
  it("builds a layer from the DATABASE_URL config", () => {
    expect(PgLive).toBeDefined()
  })

  it("parses bigint (int8) columns as numbers, not strings", () => {
    // Every minor-unit currency column (balance_minor, amount_minor, reserve_minor, ...) is
    // bigint; without this override pg returns them as strings and Schema.Int decoding fails.
    const parseBigint = types.getTypeParser(20)
    expect(parseBigint("120000")).toBe(120000)
    expect(typeof parseBigint("120000")).toBe("number")
  })

  it("parses numeric columns as numbers, not strings", () => {
    const parseNumeric = types.getTypeParser(1700)
    expect(parseNumeric("0.0216")).toBeCloseTo(0.0216)
    expect(typeof parseNumeric("0.0216")).toBe("number")
  })
})
