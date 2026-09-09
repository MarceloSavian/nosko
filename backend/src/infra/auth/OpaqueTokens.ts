import { createHash, randomBytes } from "node:crypto"
import { Context, Layer } from "effect"

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

export class OpaqueTokens extends Context.Tag("OpaqueTokens")<
  OpaqueTokens,
  {
    readonly generate: () => { readonly token: string; readonly hash: string }
    readonly hash: (token: string) => string
  }
>() {}

export const OpaqueTokensLive = Layer.succeed(OpaqueTokens, {
  generate: () => {
    const token = randomBytes(32).toString("base64url")
    return { token, hash: hashToken(token) }
  },
  hash: hashToken,
})
