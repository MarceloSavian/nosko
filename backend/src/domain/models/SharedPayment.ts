import { Schema } from "effect"

export const SharedPayment = Schema.Struct({
  id: Schema.UUID,
  householdId: Schema.UUID,
  cycleId: Schema.UUID,
  accountId: Schema.UUID,
  bookedAt: Schema.DateTimeUtcFromDate,
  description: Schema.String,
  counterparty: Schema.NullOr(Schema.String),
  amountMinor: Schema.Int,
  currency: Schema.String,
  amountBaseMinor: Schema.Int,
  fxRate: Schema.NullOr(Schema.Number),
  categoryId: Schema.UUID,
  createdBy: Schema.UUID,
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
})
export type SharedPayment = typeof SharedPayment.Type

export interface NewSharedPayment {
  readonly householdId: string
  readonly cycleId: string
  readonly accountId: string
  readonly bookedAt: Date
  readonly description: string
  readonly counterparty: string | null
  readonly amountMinor: number
  readonly currency: string
  readonly amountBaseMinor: number
  readonly fxRate: number | null
  readonly categoryId: string
  readonly createdBy: string
}

export interface SharedPaymentUpdate {
  readonly description: string
  readonly counterparty: string | null
  readonly amountMinor: number
  readonly amountBaseMinor: number
  readonly fxRate: number | null
  readonly categoryId: string
}
