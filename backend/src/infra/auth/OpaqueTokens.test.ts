import { createHash } from "node:crypto"
import { describe, expect, it } from "@jest/globals"
import { Effect } from "effect"
import { OpaqueTokens, OpaqueTokensLive } from "./OpaqueTokens"

const run = <A>(effect: Effect.Effect<A, never, OpaqueTokens>) =>
  Effect.runSync(effect.pipe(Effect.provide(OpaqueTokensLive)))

describe("OpaqueTokensLive", () => {
  it("generates a token whose hash matches sha256 of the raw token", () => {
    const { token, hash } = run(
      Effect.gen(function* () {
        const tokens = yield* OpaqueTokens
        return tokens.generate()
      }),
    )
    expect(hash).toBe(createHash("sha256").update(token).digest("hex"))
  })

  it("generates a different token on each call", () => {
    const [first, second] = run(
      Effect.gen(function* () {
        const tokens = yield* OpaqueTokens
        return [tokens.generate().token, tokens.generate().token] as const
      }),
    )
    expect(first).not.toBe(second)
  })

  it("hashes an arbitrary string the same way as generate() would", () => {
    const hash = run(
      Effect.gen(function* () {
        const tokens = yield* OpaqueTokens
        return tokens.hash("a-known-token-value")
      }),
    )
    expect(hash).toBe(createHash("sha256").update("a-known-token-value").digest("hex"))
  })

  it("generates a 6-digit code by default, hashed the same way", () => {
    const { code, hash } = run(
      Effect.gen(function* () {
        const tokens = yield* OpaqueTokens
        return tokens.generateCode()
      }),
    )
    expect(code).toMatch(/^\d{6}$/)
    expect(hash).toBe(createHash("sha256").update(code).digest("hex"))
  })

  it("generates a code with a custom digit count", () => {
    const { code } = run(
      Effect.gen(function* () {
        const tokens = yield* OpaqueTokens
        return tokens.generateCode(4)
      }),
    )
    expect(code).toMatch(/^\d{4}$/)
  })
})
