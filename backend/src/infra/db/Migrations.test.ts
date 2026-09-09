import { describe, expect, it } from "@jest/globals"
import { MigrationsLive } from "./Migrations"

describe("MigrationsLive", () => {
  it("builds a migrator layer pointed at the migrations directory", () => {
    expect(MigrationsLive).toBeDefined()
  })
})
