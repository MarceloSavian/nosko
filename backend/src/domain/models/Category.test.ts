import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { Category, NewHouseholdCategory, NewPersonalCategory } from "./Category"

describe("Category", () => {
  it("decodes a household-scoped row", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(Category)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        scope: "household",
        ownerUserId: null,
        name: "Mercado & Feira",
        color: "#22c55e",
        sortOrder: 0,
      }),
    )
    expect(decoded.scope).toBe("household")
    expect(decoded.ownerUserId).toBeNull()
  })

  it("decodes a personal-scoped row", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(Category)({
        id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
        householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        scope: "personal",
        ownerUserId: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
        name: "Lazer & Livros",
        color: null,
        sortOrder: 1,
      }),
    )
    expect(decoded.scope).toBe("personal")
    expect(decoded.ownerUserId).toBe("8c9e6679-7425-40de-944b-e07fc1f90ae9")
  })
})

describe("NewHouseholdCategory", () => {
  it("decodes creation input", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(NewHouseholdCategory)({
        householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        name: "Transporte",
        color: null,
        sortOrder: 3,
      }),
    )
    expect(decoded.name).toBe("Transporte")
  })
})

describe("NewPersonalCategory", () => {
  it("decodes creation input", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(NewPersonalCategory)({
        householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
        ownerUserId: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
        name: "Cafés & Coworking",
        color: null,
        sortOrder: 0,
      }),
    )
    expect(decoded.ownerUserId).toBe("8c9e6679-7425-40de-944b-e07fc1f90ae9")
  })
})
