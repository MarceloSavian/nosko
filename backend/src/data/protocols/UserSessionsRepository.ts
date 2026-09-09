import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type { NewUserSession, UserSession } from "../../domain/models/UserSession"

export class UserSessionsRepository extends Context.Tag("UserSessionsRepository")<
  UserSessionsRepository,
  {
    readonly create: (input: NewUserSession) => Effect.Effect<UserSession, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<UserSession>, SqlError>
    readonly findByRefreshTokenHash: (
      userId: string,
      refreshTokenHash: string,
    ) => Effect.Effect<Option.Option<UserSession>, SqlError>
    readonly listByUser: (userId: string) => Effect.Effect<ReadonlyArray<UserSession>, SqlError>
    readonly revoke: (id: string) => Effect.Effect<void, SqlError>
    readonly revokeAllForUser: (userId: string) => Effect.Effect<void, SqlError>
  }
>() {}
