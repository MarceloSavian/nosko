import { describe, expect, it } from "@jest/globals"
import { ConfigProvider, Effect } from "effect"
import { SignJWT } from "jose"
import { AccessTokens, AccessTokensLive } from "./AccessTokens"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const run = <A, E>(effect: Effect.Effect<A, E, AccessTokens>) =>
  Effect.runPromise(
    effect.pipe(Effect.provide(AccessTokensLive), Effect.withConfigProvider(withConfig)),
  )

describe("AccessTokensLive", () => {
  it("signs and verifies its own claims", async () => {
    const claims = await run(
      Effect.gen(function* () {
        const tokens = yield* AccessTokens
        const jwt = yield* tokens.sign({ userId: "user-1", sessionId: "session-1" })
        return yield* tokens.verify(jwt)
      }),
    )
    expect(claims).toEqual({ userId: "user-1", sessionId: "session-1" })
  })

  it("rejects a garbage token as invalid", async () => {
    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const tokens = yield* AccessTokens
        return yield* tokens.verify("not-a-real-jwt")
      }).pipe(Effect.provide(AccessTokensLive), Effect.withConfigProvider(withConfig)),
    )
    expect(exit._tag).toBe("Failure")
    if (
      exit._tag === "Failure" &&
      exit.cause._tag === "Fail" &&
      exit.cause.error._tag === "SessionInvalid"
    ) {
      expect(exit.cause.error.reason).toBe("invalid")
    } else {
      throw new Error("expected a SessionInvalid failure")
    }
  })

  it("rejects an expired token", async () => {
    const key = new TextEncoder().encode("a-very-long-random-jwt-signing-secret-value-1234567890")
    const expired = await new SignJWT({ sid: "session-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(key)

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const tokens = yield* AccessTokens
        return yield* tokens.verify(expired)
      }).pipe(Effect.provide(AccessTokensLive), Effect.withConfigProvider(withConfig)),
    )
    expect(exit._tag).toBe("Failure")
  })

  it("rejects a token missing the session claim", async () => {
    const key = new TextEncoder().encode("a-very-long-random-jwt-signing-secret-value-1234567890")
    const malformed = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(key)

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const tokens = yield* AccessTokens
        return yield* tokens.verify(malformed)
      }).pipe(Effect.provide(AccessTokensLive), Effect.withConfigProvider(withConfig)),
    )
    expect(exit._tag).toBe("Failure")
  })
})
