import { HttpApi } from "@effect/platform"
import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { AuthApiGroup, LoginResultView } from "./authHttp"

describe("LoginResultView", () => {
  it("decodes the authenticated branch", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(LoginResultView)({
        status: "authenticated",
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
      }),
    )
    expect(decoded.status).toBe("authenticated")
  })

  it("decodes the mfa_required branch", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(LoginResultView)({
        status: "mfa_required",
        userId: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
      }),
    )
    expect(decoded.status).toBe("mfa_required")
  })
})

describe("AuthApiGroup", () => {
  it("declares the four cookie-writing auth endpoints", () => {
    let endpoints: ReadonlyArray<{ readonly method: string; readonly path: string }> = []
    HttpApi.reflect(HttpApi.make("test").add(AuthApiGroup), {
      onGroup: () => {},
      onEndpoint: ({ endpoint }) => {
        endpoints = [...endpoints, { method: endpoint.method, path: endpoint.path }]
      },
    })
    expect(endpoints).toEqual([
      { method: "POST", path: "/api/http/auth/login" },
      { method: "POST", path: "/api/http/auth/mfa-verify" },
      { method: "POST", path: "/api/http/auth/refresh" },
      { method: "POST", path: "/api/http/auth/logout" },
    ])
  })
})
