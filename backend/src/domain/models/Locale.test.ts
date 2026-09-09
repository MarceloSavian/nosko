import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { Locale } from "./Locale"

describe("Locale", () => {
  it("accepts en and pt-BR", async () => {
    expect(await Effect.runPromise(Schema.decodeUnknown(Locale)("en"))).toBe("en")
    expect(await Effect.runPromise(Schema.decodeUnknown(Locale)("pt-BR"))).toBe("pt-BR")
  })

  it("rejects any other value", async () => {
    const exit = await Effect.runPromiseExit(Schema.decodeUnknown(Locale)("fr"))
    expect(exit._tag).toBe("Failure")
  })
})
