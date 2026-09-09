import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type { NewUser, User, UserCredentials } from "../../domain/models/User"

export class UsersRepository extends Context.Tag("UsersRepository")<
  UsersRepository,
  {
    readonly create: (input: NewUser) => Effect.Effect<User, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<User>, SqlError>
    readonly findCredentialsByEmail: (
      email: string,
    ) => Effect.Effect<Option.Option<UserCredentials>, SqlError>
    readonly findCredentialsById: (
      id: string,
    ) => Effect.Effect<Option.Option<UserCredentials>, SqlError>
    readonly setEmailVerified: (id: string) => Effect.Effect<void, SqlError>
    readonly setPasswordHash: (id: string, passwordHash: string) => Effect.Effect<void, SqlError>
    readonly setMfa: (
      id: string,
      input: { readonly secret: string | null; readonly enabled: boolean },
    ) => Effect.Effect<void, SqlError>
  }
>() {}
