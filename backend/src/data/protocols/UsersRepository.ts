import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type { NewUser, User } from "../../domain/models/User"

export class UsersRepository extends Context.Tag("UsersRepository")<
  UsersRepository,
  {
    readonly create: (input: NewUser) => Effect.Effect<User, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<User>, SqlError>
  }
>() {}
