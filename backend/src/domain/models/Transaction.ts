import { Schema } from "effect"
import { AccountVisibility } from "./Account"

export const TransactionDirection = Schema.Literal("debit", "credit")
export type TransactionDirection = typeof TransactionDirection.Type

export const TransactionStatus = Schema.Literal("staged", "confirmed", "ignored", "duplicate")
export type TransactionStatus = typeof TransactionStatus.Type

export const Transaction = Schema.Struct({
  id: Schema.UUID,
  householdId: Schema.UUID,
  accountId: Schema.UUID,
  ownerUserId: Schema.UUID,
  visibility: AccountVisibility,
  uploadId: Schema.NullOr(Schema.UUID),
  externalId: Schema.NullOr(Schema.String),
  bookedAt: Schema.DateTimeUtcFromDate,
  description: Schema.String,
  counterparty: Schema.NullOr(Schema.String),
  amountMinor: Schema.Int,
  currency: Schema.String,
  direction: TransactionDirection,
  categoryId: Schema.NullOr(Schema.UUID),
  categoryConfidence: Schema.NullOr(Schema.Number),
  isTransfer: Schema.Boolean,
  linkedTransactionId: Schema.NullOr(Schema.UUID),
  matchedRuleId: Schema.NullOr(Schema.UUID),
  status: TransactionStatus,
  sharedPaymentId: Schema.NullOr(Schema.UUID),
  dedupHash: Schema.String,
  createdAt: Schema.DateTimeUtcFromDate,
})
export type Transaction = typeof Transaction.Type

export interface NewTransaction {
  readonly householdId: string
  readonly accountId: string
  readonly ownerUserId: string
  readonly visibility: "personal" | "shared"
  readonly uploadId: string | null
  readonly externalId: string | null
  readonly bookedAt: Date
  readonly description: string
  readonly counterparty: string | null
  readonly amountMinor: number
  readonly currency: string
  readonly direction: "debit" | "credit"
  readonly categoryId: string | null
  readonly categoryConfidence: number | null
  readonly isTransfer: boolean
  readonly linkedTransactionId: string | null
  readonly matchedRuleId: string | null
  readonly dedupHash: string
}

export interface TransactionConfirmUpdate {
  readonly categoryId: string
  readonly status: "confirmed"
  readonly sharedPaymentId: string | null
}
