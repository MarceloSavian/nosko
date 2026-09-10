import { describe, expect, it } from "@jest/globals"
import {
  CycleAlreadyExists,
  CycleClosed,
  CycleNotFound,
  MemberTransferNotFound,
} from "./cycleErrors"

describe("cycle errors", () => {
  it("carries no payload on CycleNotFound", () => {
    expect(new CycleNotFound({})._tag).toBe("CycleNotFound")
  })

  it("carries no payload on CycleAlreadyExists", () => {
    expect(new CycleAlreadyExists({})._tag).toBe("CycleAlreadyExists")
  })

  it("carries no payload on CycleClosed", () => {
    expect(new CycleClosed({})._tag).toBe("CycleClosed")
  })

  it("carries no payload on MemberTransferNotFound", () => {
    expect(new MemberTransferNotFound({})._tag).toBe("MemberTransferNotFound")
  })
})
