import { Schema } from "effect"

export const FixedBill = Schema.Struct({
  id: Schema.UUID,
  cycleId: Schema.UUID,
  recurringRuleId: Schema.NullOr(Schema.UUID),
  label: Schema.String,
  amountMinor: Schema.Int,
  currency: Schema.String,
  paid: Schema.Boolean,
  paidOnDay: Schema.NullOr(Schema.Int),
  payingAccountId: Schema.NullOr(Schema.UUID),
  dueDay: Schema.NullOr(Schema.Int),
  autoPaid: Schema.Boolean,
  categoryId: Schema.NullOr(Schema.UUID),
  sortOrder: Schema.Int,
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
})
export type FixedBill = typeof FixedBill.Type

export interface NewFixedBill {
  readonly cycleId: string
  readonly householdId: string
  readonly recurringRuleId: string | null
  readonly label: string
  readonly amountMinor: number
  readonly currency: string
  readonly payingAccountId: string | null
  readonly dueDay: number | null
  readonly categoryId: string | null
  readonly sortOrder: number
}

export interface FixedBillUpdate {
  readonly label: string
  readonly amountMinor: number
  readonly payingAccountId: string | null
  readonly dueDay: number | null
  readonly categoryId: string | null
  readonly sortOrder: number
}
