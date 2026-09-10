import { Schema } from "effect"

export const RuleMatchType = Schema.Literal("vendor_exact", "vendor_contains", "counterparty")
export type RuleMatchType = typeof RuleMatchType.Type

export const RuleCadence = Schema.Literal("monthly", "yearly", "irregular")
export type RuleCadence = typeof RuleCadence.Type

export const RuleSource = Schema.Literal("auto_detected", "user_defined")
export type RuleSource = typeof RuleSource.Type

export const RecurringRule = Schema.Struct({
  id: Schema.UUID,
  householdId: Schema.UUID,
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
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
})
export type RecurringRule = typeof RecurringRule.Type

export interface NewRecurringRule {
  readonly householdId: string
  readonly matchType: RuleMatchType
  readonly matcher: string
  readonly expectedAmountMinor: number | null
  readonly currency: string | null
  readonly categoryId: string | null
  readonly cadence: RuleCadence
  readonly isFixedBill: boolean
}

export interface RecurringRuleUpdate {
  readonly matcher: string
  readonly expectedAmountMinor: number | null
  readonly currency: string | null
  readonly categoryId: string | null
  readonly cadence: RuleCadence
  readonly isFixedBill: boolean
}
