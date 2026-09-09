import { createHash, randomBytes, randomInt } from "node:crypto"
import { Context, Layer } from "effect"

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

export class OpaqueTokens extends Context.Tag("OpaqueTokens")<
  OpaqueTokens,
  {
    readonly generate: () => { readonly token: string; readonly hash: string }
    readonly generateCode: (digits?: number) => { readonly code: string; readonly hash: string }
    readonly hash: (token: string) => string
  }
>() {}

export const OpaqueTokensLive = Layer.succeed(OpaqueTokens, {
  generate: () => {
    const token = randomBytes(32).toString("base64url")
    return { token, hash: hashToken(token) }
  },
  generateCode: (digits = 6) => {
    const code = randomInt(0, 10 ** digits)
      .toString()
      .padStart(digits, "0")
    return { code, hash: hashToken(code) }
  },
  hash: hashToken,
})
