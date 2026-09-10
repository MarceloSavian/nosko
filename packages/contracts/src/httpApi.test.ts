import { HttpApi } from "@effect/platform"
import { describe, expect, it } from "@jest/globals"
import { NoskoHttpApi } from "./httpApi"

describe("NoskoHttpApi", () => {
  it("mounts both the auth and payments HttpApi groups", () => {
    const groupNames: Array<string> = []
    HttpApi.reflect(NoskoHttpApi, {
      onGroup: ({ group }) => {
        groupNames.push(group.identifier)
      },
      onEndpoint: () => {},
    })
    expect(groupNames.sort()).toEqual(["auth", "payments"])
  })
})
