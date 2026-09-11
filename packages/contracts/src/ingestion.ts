import * as Rpc from "@effect/rpc/Rpc"
import * as RpcGroup from "@effect/rpc/RpcGroup"
import { Schema } from "effect"
import { AuthMiddleware } from "./authMiddleware.ts"
import { AccountNotFound } from "./errors/accountErrors.ts"
import { CycleClosed } from "./errors/cycleErrors.ts"
import { NoFxRate } from "./errors/fxErrors.ts"
import { NoHousehold } from "./errors/householdErrors.ts"
import {
  CategoryRequired,
  TransactionAlreadyProcessed,
  TransactionNotFound,
  UnsupportedBankFormat,
} from "./errors/ingestionErrors.ts"
import { NoCycleForDate, SharedAccountRequired } from "./errors/paymentErrors.ts"

export const BankView = Schema.Struct({
  code: Schema.String,
  name: Schema.String,
  supportsCsv: Schema.Boolean,
  supportsPdf: Schema.Boolean,
})
export type BankView = typeof BankView.Type

export const TransactionDirection = Schema.Literal("debit", "credit")
export type TransactionDirection = typeof TransactionDirection.Type

export const TransactionStatus = Schema.Literal("staged", "confirmed", "ignored", "duplicate")
export type TransactionStatus = typeof TransactionStatus.Type

export const TransactionView = Schema.Struct({
  id: Schema.UUID,
  accountId: Schema.UUID,
  visibility: Schema.Literal("personal", "shared"),
  externalId: Schema.NullOr(Schema.String),
  bookedAt: Schema.DateTimeUtc,
  description: Schema.String,
  counterparty: Schema.NullOr(Schema.String),
  amountMinor: Schema.Int,
  currency: Schema.String,
  direction: TransactionDirection,
  categoryId: Schema.NullOr(Schema.UUID),
  categoryConfidence: Schema.NullOr(Schema.Number),
  isTransfer: Schema.Boolean,
  linkedTransactionId: Schema.NullOr(Schema.UUID),
  status: TransactionStatus,
})
export type TransactionView = typeof TransactionView.Type

export const UploadStatementResultView = Schema.Struct({
  uploadId: Schema.UUID,
  newCount: Schema.Int,
  duplicateCount: Schema.Int,
  transferPairCount: Schema.Int,
})
export type UploadStatementResultView = typeof UploadStatementResultView.Type

const confirmError = Schema.Union(
  NoHousehold,
  TransactionNotFound,
  TransactionAlreadyProcessed,
  CategoryRequired,
  AccountNotFound,
  SharedAccountRequired,
  NoCycleForDate,
  CycleClosed,
  NoFxRate,
)

export const IngestionRpcs = RpcGroup.make(
  Rpc.make("ingestion.listBanks", {
    success: Schema.Array(BankView),
  }).middleware(AuthMiddleware),
  Rpc.make("ingestion.upload", {
    payload: {
      accountId: Schema.UUID,
      originalFilename: Schema.String,
      fileContent: Schema.String,
    },
    success: UploadStatementResultView,
    error: Schema.Union(NoHousehold, AccountNotFound, UnsupportedBankFormat),
  }).middleware(AuthMiddleware),
  Rpc.make("ingestion.listStaged", {
    success: Schema.Array(TransactionView),
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("ingestion.confirm", {
    payload: { transactionId: Schema.UUID, categoryId: Schema.NullOr(Schema.UUID) },
    success: TransactionView,
    error: confirmError,
  }).middleware(AuthMiddleware),
  Rpc.make("ingestion.bulkConfirm", {
    payload: {
      transactionIds: Schema.Array(Schema.UUID),
      categoryId: Schema.NullOr(Schema.UUID),
    },
    success: Schema.Array(TransactionView),
    error: confirmError,
  }).middleware(AuthMiddleware),
  Rpc.make("ingestion.ignore", {
    payload: { transactionId: Schema.UUID },
    success: TransactionView,
    error: Schema.Union(TransactionNotFound, TransactionAlreadyProcessed),
  }).middleware(AuthMiddleware),
  Rpc.make("ingestion.recategorize", {
    payload: { transactionId: Schema.UUID, categoryId: Schema.UUID },
    success: TransactionView,
    error: Schema.Union(TransactionNotFound, TransactionAlreadyProcessed),
  }).middleware(AuthMiddleware),
  Rpc.make("ingestion.listMyPayments", {
    success: Schema.Array(TransactionView),
  }).middleware(AuthMiddleware),
)
