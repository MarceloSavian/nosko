import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { UsersRepository } from "../../data/protocols/UsersRepository"
import { User, UserCredentials } from "../../domain/models/User"
import { decodeRow } from "./decode"

export const UsersRepositoryLive = Layer.effect(
  UsersRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeUser = decodeRow(User)
    const decodeCredentials = decodeRow(UserCredentials)
    const decodeOption =
      <A>(decode: (row: unknown) => Effect.Effect<A, never>) =>
      (rows: ReadonlyArray<unknown>) =>
        rows.length === 0
          ? Effect.succeed(Option.none())
          : decode(rows[0]).pipe(Effect.map(Option.some))

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("users")} ${sql.insert({
          email: input.email,
          passwordHash: input.passwordHash,
          name: input.name,
          preferredLocale: input.preferredLocale,
        })} RETURNING *`.pipe(Effect.flatMap((rows) => decodeUser(rows[0]))),
      findById: (id) =>
        sql`SELECT * FROM ${sql("users")} WHERE id = ${id}`.pipe(
          Effect.flatMap(decodeOption(decodeUser)),
        ),
      findCredentialsByEmail: (email) =>
        sql`SELECT * FROM ${sql("users")} WHERE email = ${email}`.pipe(
          Effect.flatMap(decodeOption(decodeCredentials)),
        ),
      findCredentialsById: (id) =>
        sql`SELECT * FROM ${sql("users")} WHERE id = ${id}`.pipe(
          Effect.flatMap(decodeOption(decodeCredentials)),
        ),
      setEmailVerified: (id) =>
        sql`UPDATE ${sql("users")} SET ${sql.update({
          emailVerified: true,
          updatedAt: new Date(),
        })} WHERE id = ${id}`.pipe(Effect.asVoid),
      setPasswordHash: (id, passwordHash) =>
        sql`UPDATE ${sql("users")} SET ${sql.update({
          passwordHash,
          updatedAt: new Date(),
        })} WHERE id = ${id}`.pipe(Effect.asVoid),
      setMfa: (id, input) =>
        sql`UPDATE ${sql("users")} SET ${sql.update({
          mfaSecret: input.secret,
          mfaEnabled: input.enabled,
          updatedAt: new Date(),
        })} WHERE id = ${id}`.pipe(Effect.asVoid),
    }
  }),
)
