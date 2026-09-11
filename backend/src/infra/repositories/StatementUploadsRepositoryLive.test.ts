import { describe, expect, it } from "@jest/globals"
import { Effect } from "effect"
import { StatementUploadsRepository } from "../../data/protocols/StatementUploadsRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { StatementUploadsRepositoryLive } from "./StatementUploadsRepositoryLive"

const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const accountId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"
const uploadedBy = "8c9e6679-7425-40de-944b-e07fc1f90ae9"

const baseRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90aea",
  household_id: householdId,
  account_id: accountId,
  uploaded_by: uploadedBy,
  file_key: `${householdId}/${accountId}/file.csv`,
  original_filename: "extrato.csv",
  format: "csv",
  period_start: null,
  period_end: null,
  status: "uploaded",
  error: null,
  uploaded_at: new Date("2026-01-01T00:00:00.000Z"),
}

describe("StatementUploadsRepositoryLive", () => {
  it("creates an upload row", async () => {
    const { layer, queries } = makeTestSqlClient(() => [baseRow])

    const created = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* StatementUploadsRepository
        return yield* repo.create({
          householdId,
          accountId,
          uploadedBy,
          fileKey: baseRow.file_key,
          originalFilename: "extrato.csv",
          format: "csv",
        })
      }).pipe(Effect.provide(StatementUploadsRepositoryLive), Effect.provide(layer)),
    )

    expect(created.status).toBe("uploaded")
    expect(queries[0]?.sql).toContain('INSERT INTO "statement_uploads"')
  })

  it("finds an upload by id, and None when missing", async () => {
    const { layer } = makeTestSqlClient(() => [baseRow])
    const found = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* StatementUploadsRepository
        return yield* repo.findById(baseRow.id)
      }).pipe(Effect.provide(StatementUploadsRepositoryLive), Effect.provide(layer)),
    )
    expect(found._tag).toBe("Some")

    const { layer: emptyLayer } = makeTestSqlClient(() => [])
    const missing = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* StatementUploadsRepository
        return yield* repo.findById(baseRow.id)
      }).pipe(Effect.provide(StatementUploadsRepositoryLive), Effect.provide(emptyLayer)),
    )
    expect(missing._tag).toBe("None")
  })

  it("completes an upload with a period and status", async () => {
    const completedRow = {
      ...baseRow,
      period_start: new Date("2026-01-01"),
      period_end: new Date("2026-01-31"),
      status: "parsed",
    }
    const { layer, queries } = makeTestSqlClient(() => [completedRow])

    const completed = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* StatementUploadsRepository
        return yield* repo.complete(baseRow.id, {
          periodStart: new Date("2026-01-01"),
          periodEnd: new Date("2026-01-31"),
          status: "parsed",
          error: null,
        })
      }).pipe(Effect.provide(StatementUploadsRepositoryLive), Effect.provide(layer)),
    )

    expect(completed.status).toBe("parsed")
    expect(queries[0]?.sql).toContain('UPDATE "statement_uploads"')
  })
})
