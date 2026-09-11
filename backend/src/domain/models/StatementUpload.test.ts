import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { StatementUpload } from "./StatementUpload"

const now = new Date("2026-01-01T00:00:00.000Z")

const baseRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  accountId: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
  uploadedBy: "8c9e6679-7425-40de-944b-e07fc1f90aea",
  fileKey: "household/account/file.csv",
  originalFilename: "extrato.csv",
  format: "csv",
  periodStart: null,
  periodEnd: null,
  status: "uploaded",
  error: null,
  uploadedAt: now,
}

describe("StatementUpload", () => {
  it("decodes an in-progress upload", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(StatementUpload)(baseRow))
    expect(decoded.status).toBe("uploaded")
    expect(decoded.periodStart).toBeNull()
  })

  it("decodes a completed upload with a period and a failed one with an error", async () => {
    const parsed = await Effect.runPromise(
      Schema.decodeUnknown(StatementUpload)({
        ...baseRow,
        periodStart: now,
        periodEnd: now,
        status: "parsed",
      }),
    )
    expect(parsed.status).toBe("parsed")

    const failed = await Effect.runPromise(
      Schema.decodeUnknown(StatementUpload)({ ...baseRow, status: "failed", error: "bad file" }),
    )
    expect(failed.error).toBe("bad file")
  })
})
