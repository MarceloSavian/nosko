import { describe, expect, it } from "@jest/globals"
import { Effect } from "effect"
import { PasswordHasher, PasswordHasherLive } from "./PasswordHasher"

const run = <A>(effect: Effect.Effect<A, never, PasswordHasher>) =>
  Effect.runPromise(effect.pipe(Effect.provide(PasswordHasherLive)))

describe("PasswordHasherLive", () => {
  it("hashes a password into an argon2id-encoded string", async () => {
    const encoded = await run(
      Effect.gen(function* () {
        const hasher = yield* PasswordHasher
        return yield* hasher.hash("correct horse battery staple")
      }),
    )
    expect(encoded).toMatch(/^\$argon2id\$/)
  })

  it("verifies the correct password against its own hash", async () => {
    const ok = await run(
      Effect.gen(function* () {
        const hasher = yield* PasswordHasher
        const encoded = yield* hasher.hash("correct horse battery staple")
        return yield* hasher.verify("correct horse battery staple", encoded)
      }),
    )
    expect(ok).toBe(true)
  })

  it("rejects an incorrect password", async () => {
    const ok = await run(
      Effect.gen(function* () {
        const hasher = yield* PasswordHasher
        const encoded = yield* hasher.hash("correct horse battery staple")
        return yield* hasher.verify("wrong password", encoded)
      }),
    )
    expect(ok).toBe(false)
  })

  it("produces a different hash each time (random salt)", async () => {
    const [first, second] = await run(
      Effect.gen(function* () {
        const hasher = yield* PasswordHasher
        return [yield* hasher.hash("same password"), yield* hasher.hash("same password")] as const
      }),
    )
    expect(first).not.toBe(second)
  })
})
