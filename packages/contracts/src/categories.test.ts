import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { CategoriesRpcs, CategoryView } from "./categories"

const baseCategory = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  scope: "household",
  ownerUserId: null,
  name: "Mercado & Feira",
  color: null,
  sortOrder: 0,
}

describe("CategoryView", () => {
  it("decodes a wire-shaped category", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(CategoryView)(baseCategory))
    expect(decoded.name).toBe("Mercado & Feira")
  })
})

describe("CategoriesRpcs", () => {
  it("declares the category listing action", () => {
    expect([...CategoriesRpcs.requests.keys()]).toEqual(["categories.list"])
  })
})
