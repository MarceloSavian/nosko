import { HttpApi } from "@effect/platform"
import { describe, expect, it } from "@jest/globals"
import { PaymentsApiGroup } from "./paymentsHttp"

describe("PaymentsApiGroup", () => {
  it("declares the CSV export endpoint", () => {
    let endpoints: ReadonlyArray<{ readonly method: string; readonly path: string }> = []
    HttpApi.reflect(HttpApi.make("test").add(PaymentsApiGroup), {
      onGroup: () => {},
      onEndpoint: ({ endpoint }) => {
        endpoints = [...endpoints, { method: endpoint.method, path: endpoint.path }]
      },
    })
    expect(endpoints).toEqual([{ method: "GET", path: "/api/http/payments/export" }])
  })
})
