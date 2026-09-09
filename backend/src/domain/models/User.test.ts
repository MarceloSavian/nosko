import { describe, expect, it } from "@jest/globals"
import { DateTime, Effect, Schema } from "effect"
import { NewUser, User } from "./User"

describe("User", () => {
  it("decodes a database row, stripping sensitive columns", async () => {
    const row = {
      id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
      email: "marcelo@example.com",
      passwordHash: "argon2id$...",
      mfaSecret: "encrypted",
      name: "Marcelo",
      preferredLocale: "pt-BR",
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    }

    const decoded = await Effect.runPromise(Schema.decodeUnknown(User)(row))

    expect({
      ...decoded,
      createdAt: DateTime.toDateUtc(decoded.createdAt),
      updatedAt: DateTime.toDateUtc(decoded.updatedAt),
    }).toEqual({
      id: row.id,
      email: row.email,
      name: row.name,
      preferredLocale: row.preferredLocale,
      emailVerified: true,
      mfaEnabled: false,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
    expect(decoded).not.toHaveProperty("passwordHash")
  })

  it("fails to decode a row missing a required field", async () => {
    const exit = await Effect.runPromiseExit(Schema.decodeUnknown(User)({ id: "not-checked" }))
    expect(exit._tag).toBe("Failure")
  })
})

describe("NewUser", () => {
  it("decodes signup input", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(NewUser)({
        email: "gabriele@example.com",
        passwordHash: "argon2id$...",
        name: "Gabriele",
        preferredLocale: "pt-BR",
      }),
    )
    expect(decoded.email).toBe("gabriele@example.com")
  })
})
