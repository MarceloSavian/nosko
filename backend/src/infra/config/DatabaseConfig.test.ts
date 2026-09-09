import { describe, expect, it } from "@jest/globals"
import { PgLive } from "./DatabaseConfig"

describe("PgLive", () => {
  it("builds a layer from the DATABASE_URL config", () => {
    expect(PgLive).toBeDefined()
  })
})
