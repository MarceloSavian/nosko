import { randomBytes } from "node:crypto"
import { Context, Effect, Layer } from "effect"
import { argon2id, argon2Verify } from "hash-wasm"

export class PasswordHasher extends Context.Tag("PasswordHasher")<
  PasswordHasher,
  {
    readonly hash: (password: string) => Effect.Effect<string>
    readonly verify: (password: string, hash: string) => Effect.Effect<boolean>
  }
>() {}

export const PasswordHasherLive = Layer.succeed(PasswordHasher, {
  hash: (password) =>
    Effect.promise(() =>
      argon2id({
        password,
        salt: randomBytes(16),
        iterations: 2,
        parallelism: 1,
        memorySize: 19456,
        hashLength: 32,
        outputType: "encoded",
      }),
    ),
  verify: (password, hash) => Effect.promise(() => argon2Verify({ password, hash })),
})
