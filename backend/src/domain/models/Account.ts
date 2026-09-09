import { Schema } from "effect"

export const AccountVisibility = Schema.Literal("personal", "shared")
export type AccountVisibility = typeof AccountVisibility.Type

export const AccountOwnership = Schema.Literal("sole", "joint")
export type AccountOwnership = typeof AccountOwnership.Type

export const AccountInstitution = Schema.Literal(
  "ing",
  "revolut",
  "amex",
  "nubank",
  "c6",
  "abn",
  "other",
)
export type AccountInstitution = typeof AccountInstitution.Type

export const AccountType = Schema.Literal(
  "checking",
  "credit_card",
  "savings",
  "brokerage",
  "investment",
  "vault",
)
export type AccountType = typeof AccountType.Type

export const AccountSource = Schema.Literal("manual", "file_import")
export type AccountSource = typeof AccountSource.Type

export const Account = Schema.Struct({
  id: Schema.UUID,
  householdId: Schema.UUID,
  ownerUserId: Schema.UUID,
  coOwnerUserId: Schema.NullOr(Schema.UUID),
  ownership: AccountOwnership,
  visibility: AccountVisibility,
  institution: AccountInstitution,
  nickname: Schema.String,
  type: AccountType,
  currency: Schema.String,
  maskedId: Schema.NullOr(Schema.String),
  balanceMinor: Schema.NullOr(Schema.Int),
  purpose: Schema.NullOr(Schema.String),
  statementCloseDay: Schema.NullOr(Schema.Int),
  creditLimitMinor: Schema.NullOr(Schema.Int),
  autopayAccountId: Schema.NullOr(Schema.UUID),
  source: AccountSource,
  lastImportAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
})
export type Account = typeof Account.Type

export const NewAccount = Schema.Struct({
  householdId: Schema.UUID,
  ownerUserId: Schema.UUID,
  ownership: AccountOwnership,
  visibility: AccountVisibility,
  institution: AccountInstitution,
  nickname: Schema.String,
  type: AccountType,
  currency: Schema.String,
  maskedId: Schema.NullOr(Schema.String),
  balanceMinor: Schema.NullOr(Schema.Int),
  purpose: Schema.NullOr(Schema.String),
  statementCloseDay: Schema.NullOr(Schema.Int),
  creditLimitMinor: Schema.NullOr(Schema.Int),
  autopayAccountId: Schema.NullOr(Schema.UUID),
})
export type NewAccount = typeof NewAccount.Type
