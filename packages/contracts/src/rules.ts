import * as Rpc from "@effect/rpc/Rpc"
import * as RpcGroup from "@effect/rpc/RpcGroup"
import { Schema } from "effect"
import { AuthMiddleware } from "./authMiddleware.ts"
import { NoHousehold } from "./errors/householdErrors.ts"
import { RecurringRuleNotFound } from "./errors/ruleErrors.ts"

export const RuleMatchType = Schema.Literal("vendor_exact", "vendor_contains", "counterparty")
export type RuleMatchType = typeof RuleMatchType.Type

export const RuleCadence = Schema.Literal("monthly", "yearly", "irregular")
export type RuleCadence = typeof RuleCadence.Type

export const RuleSource = Schema.Literal("auto_detected", "user_defined")
export type RuleSource = typeof RuleSource.Type

export const RecurringRuleView = Schema.Struct({
  id: Schema.UUID,
  matchType: RuleMatchType,
  matcher: Schema.String,
  expectedAmountMinor: Schema.NullOr(Schema.Int),
  currency: Schema.NullOr(Schema.String),
  categoryId: Schema.NullOr(Schema.UUID),
  cadence: RuleCadence,
  isFixedBill: Schema.Boolean,
  active: Schema.Boolean,
  source: RuleSource,
  confidence: Schema.NullOr(Schema.Number),
})
export type RecurringRuleView = typeof RecurringRuleView.Type

const newRulePayload = {
  matchType: RuleMatchType,
  matcher: Schema.String,
  expectedAmountMinor: Schema.NullOr(Schema.Int),
  currency: Schema.NullOr(Schema.String),
  categoryId: Schema.NullOr(Schema.UUID),
  cadence: RuleCadence,
  isFixedBill: Schema.Boolean,
}

const ruleUpdatePayload = {
  matcher: Schema.String,
  expectedAmountMinor: Schema.NullOr(Schema.Int),
  currency: Schema.NullOr(Schema.String),
  categoryId: Schema.NullOr(Schema.UUID),
  cadence: RuleCadence,
  isFixedBill: Schema.Boolean,
}

export const RulesRpcs = RpcGroup.make(
  Rpc.make("rules.list", {
    success: Schema.Array(RecurringRuleView),
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("rules.create", {
    payload: newRulePayload,
    success: RecurringRuleView,
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("rules.update", {
    payload: { id: Schema.UUID, ...ruleUpdatePayload },
    success: RecurringRuleView,
    error: RecurringRuleNotFound,
  }).middleware(AuthMiddleware),
  Rpc.make("rules.deactivate", {
    payload: { id: Schema.UUID },
    success: RecurringRuleView,
    error: RecurringRuleNotFound,
  }).middleware(AuthMiddleware),
)
