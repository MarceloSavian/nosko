import { describe, expect, it } from "@jest/globals"
import { AuthMiddleware, CurrentUser } from "./authMiddleware"

describe("AuthMiddleware", () => {
  it("provides CurrentUser and declares a failure schema", () => {
    expect(AuthMiddleware.provides).toBe(CurrentUser)
    expect(AuthMiddleware.failure).toBeDefined()
  })
})
