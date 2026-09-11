import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { StatementUploadsRepository } from "../../data/protocols/StatementUploadsRepository"
import { StatementUpload } from "../../domain/models/StatementUpload"
import { decodeRow } from "./decode"

export const StatementUploadsRepositoryLive = Layer.effect(
  StatementUploadsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeUpload = decodeRow(StatementUpload)
    const decodeFirst = (rows: ReadonlyArray<unknown>) => decodeUpload(rows[0])

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("statementUploads")} ${sql.insert({
          householdId: input.householdId,
          accountId: input.accountId,
          uploadedBy: input.uploadedBy,
          fileKey: input.fileKey,
          originalFilename: input.originalFilename,
          format: input.format,
        })} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      findById: (id) =>
        sql`SELECT * FROM ${sql("statementUploads")} WHERE id = ${id}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeFirst(rows).pipe(Effect.map(Option.some)),
          ),
        ),
      complete: (id, result) =>
        sql`UPDATE ${sql("statementUploads")} SET ${sql.update({
          periodStart: result.periodStart,
          periodEnd: result.periodEnd,
          status: result.status,
          error: result.error,
        })} WHERE id = ${id} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
    }
  }),
)
