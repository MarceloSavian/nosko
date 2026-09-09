import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { decodeRow } from "./decode"

const Point = Schema.Struct({ x: Schema.Number, y: Schema.Number })

describe("decodeRow", () => {
  it("decodes a matching row", async () => {
    const decoded = await Effect.runPromise(decodeRow(Point)({ x: 1, y: 2, extra: "ignored" }))
    expect(decoded).toEqual({ x: 1, y: 2 })
  })

  it("dies when the row does not match the schema", async () => {
    const exit = await Effect.runPromiseExit(decodeRow(Point)({ x: "not-a-number" }))
    expect(exit._tag).toBe("Failure")
    if (exit._tag === "Failure") {
      expect(exit.cause._tag).toBe("Die")
    }
  })
})
