import { Schema } from "effect"

export const FxRate = Schema.Struct({
  id: Schema.UUID,
  rateDate: Schema.DateTimeUtcFromDate,
  base: Schema.String,
  quote: Schema.String,
  rate: Schema.Number,
  createdAt: Schema.DateTimeUtcFromDate,
})
export type FxRate = typeof FxRate.Type

export interface NewFxRate {
  readonly rateDate: Date
  readonly base: string
  readonly quote: string
  readonly rate: number
}
