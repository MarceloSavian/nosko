import { Schema } from "effect"

export const StatementFormat = Schema.Literal("csv", "pdf")
export type StatementFormat = typeof StatementFormat.Type

export const StatementUploadStatus = Schema.Literal("uploaded", "parsing", "parsed", "failed")
export type StatementUploadStatus = typeof StatementUploadStatus.Type

export const StatementUpload = Schema.Struct({
  id: Schema.UUID,
  householdId: Schema.UUID,
  accountId: Schema.UUID,
  uploadedBy: Schema.UUID,
  fileKey: Schema.String,
  originalFilename: Schema.String,
  format: StatementFormat,
  periodStart: Schema.NullOr(Schema.DateTimeUtcFromDate),
  periodEnd: Schema.NullOr(Schema.DateTimeUtcFromDate),
  status: StatementUploadStatus,
  error: Schema.NullOr(Schema.String),
  uploadedAt: Schema.DateTimeUtcFromDate,
})
export type StatementUpload = typeof StatementUpload.Type

export interface NewStatementUpload {
  readonly householdId: string
  readonly accountId: string
  readonly uploadedBy: string
  readonly fileKey: string
  readonly originalFilename: string
  readonly format: StatementFormat
}

export interface StatementUploadResult {
  readonly periodStart: Date | null
  readonly periodEnd: Date | null
  readonly status: StatementUploadStatus
  readonly error: string | null
}
