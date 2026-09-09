import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type { AuthToken, AuthTokenType, NewAuthToken } from "../../domain/models/AuthToken"

export class AuthTokensRepository extends Context.Tag("AuthTokensRepository")<
  AuthTokensRepository,
  {
    readonly create: (input: NewAuthToken) => Effect.Effect<AuthToken, SqlError>
    readonly findValid: (
      userId: string,
      type: AuthTokenType,
      tokenHash: string,
    ) => Effect.Effect<Option.Option<AuthToken>, SqlError>
    readonly consume: (id: string) => Effect.Effect<void, SqlError>
  }
>() {}
