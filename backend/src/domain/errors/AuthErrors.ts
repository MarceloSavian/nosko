import { Data } from "effect"

export class EmailAlreadyRegistered extends Data.TaggedError("EmailAlreadyRegistered")<{
  readonly email: string
}> {}

export class InvalidCredentials extends Data.TaggedError("InvalidCredentials")<
  Record<string, never>
> {}

export class EmailNotVerified extends Data.TaggedError("EmailNotVerified")<{
  readonly userId: string
}> {}

export class TokenInvalid extends Data.TaggedError("TokenInvalid")<{
  readonly reason: "not_found" | "expired" | "consumed" | "wrong_type"
}> {}

export class MfaCodeInvalid extends Data.TaggedError("MfaCodeInvalid")<Record<string, never>> {}

export class MfaAlreadyEnabled extends Data.TaggedError("MfaAlreadyEnabled")<
  Record<string, never>
> {}

export class SessionInvalid extends Data.TaggedError("SessionInvalid")<{
  readonly reason: "not_found" | "revoked" | "expired" | "invalid"
}> {}
