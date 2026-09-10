import { Config, Context, Effect, Layer, Redacted } from "effect"
import { decodeJwt, jwtVerify, SignJWT } from "jose"
import { SessionInvalid } from "../../domain/errors/AuthErrors"

export interface AccessTokenClaims {
  readonly userId: string
  readonly sessionId: string
}

const claimsFromPayload = (payload: { readonly sub?: string; readonly sid?: unknown }) => {
  if (typeof payload.sub !== "string" || typeof payload.sid !== "string") {
    throw new Error("access token is missing required claims")
  }
  return { userId: payload.sub, sessionId: payload.sid }
}

export class AccessTokens extends Context.Tag("AccessTokens")<
  AccessTokens,
  {
    readonly sign: (claims: AccessTokenClaims) => Effect.Effect<string>
    readonly verify: (token: string) => Effect.Effect<AccessTokenClaims, SessionInvalid>
    readonly decodeUnverified: (token: string) => Effect.Effect<AccessTokenClaims, SessionInvalid>
  }
>() {}

export const AccessTokensLive = Layer.effect(
  AccessTokens,
  Effect.gen(function* () {
    const secret = yield* Config.redacted("JWT_SECRET")
    const key = new TextEncoder().encode(Redacted.value(secret))

    return {
      sign: (claims) =>
        Effect.promise(() =>
          new SignJWT({ sid: claims.sessionId })
            .setProtectedHeader({ alg: "HS256" })
            .setSubject(claims.userId)
            .setIssuedAt()
            .setExpirationTime("15m")
            .sign(key),
        ),
      verify: (token) =>
        Effect.tryPromise({
          try: async () => {
            const { payload } = await jwtVerify(token, key)
            return claimsFromPayload(payload)
          },
          catch: () => new SessionInvalid({ reason: "invalid" }),
        }),
      decodeUnverified: (token) =>
        Effect.try({
          try: () => claimsFromPayload(decodeJwt(token)),
          catch: () => new SessionInvalid({ reason: "invalid" }),
        }),
    }
  }),
)
