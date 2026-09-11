import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type {
  NewStatementUpload,
  StatementUpload,
  StatementUploadResult,
} from "../../domain/models/StatementUpload"

export class StatementUploadsRepository extends Context.Tag("StatementUploadsRepository")<
  StatementUploadsRepository,
  {
    readonly create: (input: NewStatementUpload) => Effect.Effect<StatementUpload, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<StatementUpload>, SqlError>
    readonly complete: (
      id: string,
      result: StatementUploadResult,
    ) => Effect.Effect<StatementUpload, SqlError>
  }
>() {}
