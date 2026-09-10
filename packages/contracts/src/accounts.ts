import * as Rpc from "@effect/rpc/Rpc"
import * as RpcGroup from "@effect/rpc/RpcGroup"
import { Schema } from "effect"
import { AuthMiddleware } from "./authMiddleware"
import { AccountNotFound, JointAccountVisibilityLocked } from "./errors/accountErrors"
import { NoHousehold } from "./errors/householdErrors"

export const AccountOwnership = Schema.Literal("sole", "joint")
export type AccountOwnership = typeof AccountOwnership.Type

export const AccountVisibility = Schema.Literal("personal", "shared")
export type AccountVisibility = typeof AccountVisibility.Type

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

export const AccountScope = Schema.Literal("shared", "personal")
export type AccountScope = typeof AccountScope.Type

export const AccountView = Schema.Struct({
  id: Schema.UUID,
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
  source: Schema.Literal("manual", "file_import"),
  lastImportAt: Schema.NullOr(Schema.DateTimeUtc),
})
export type AccountView = typeof AccountView.Type

export const AccountSummaryEntry = Schema.Struct({
  account: AccountView,
  balanceBaseMinor: Schema.NullOr(Schema.Int),
})
export type AccountSummaryEntry = typeof AccountSummaryEntry.Type

export const SharedSummaryView = Schema.Struct({
  accounts: Schema.Array(AccountSummaryEntry),
  totalBaseMinor: Schema.Int,
})
export type SharedSummaryView = typeof SharedSummaryView.Type

export const PersonalSummaryView = Schema.Struct({
  accounts: Schema.Array(AccountSummaryEntry),
  liquidBaseMinor: Schema.Int,
  investedBaseMinor: Schema.Int,
  totalBaseMinor: Schema.Int,
})
export type PersonalSummaryView = typeof PersonalSummaryView.Type

const newAccountPayload = {
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
}

const accountUpdatePayload = {
  nickname: Schema.String,
  maskedId: Schema.NullOr(Schema.String),
  balanceMinor: Schema.NullOr(Schema.Int),
  purpose: Schema.NullOr(Schema.String),
  statementCloseDay: Schema.NullOr(Schema.Int),
  creditLimitMinor: Schema.NullOr(Schema.Int),
  autopayAccountId: Schema.NullOr(Schema.UUID),
}

export const AccountsRpcs = RpcGroup.make(
  Rpc.make("accounts.list", {
    payload: { scope: AccountScope },
    success: Schema.Array(AccountView),
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("accounts.create", {
    payload: newAccountPayload,
    success: AccountView,
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("accounts.update", {
    payload: { id: Schema.UUID, ...accountUpdatePayload },
    success: AccountView,
    error: AccountNotFound,
  }).middleware(AuthMiddleware),
  Rpc.make("accounts.setVisibility", {
    payload: { id: Schema.UUID, visibility: AccountVisibility },
    success: AccountView,
    error: Schema.Union(AccountNotFound, JointAccountVisibilityLocked),
  }).middleware(AuthMiddleware),
  Rpc.make("accounts.setCoOwner", {
    payload: { id: Schema.UUID, coOwnerUserId: Schema.UUID },
    success: AccountView,
    error: AccountNotFound,
  }).middleware(AuthMiddleware),
  Rpc.make("accounts.remove", {
    payload: { id: Schema.UUID },
    error: AccountNotFound,
  }).middleware(AuthMiddleware),
  Rpc.make("accounts.sharedSummary", {
    success: SharedSummaryView,
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("accounts.personalSummary", {
    success: PersonalSummaryView,
  }).middleware(AuthMiddleware),
)
