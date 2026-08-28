import { Schema } from "effect"

export const Currency = Schema.Literal("EUR", "BRL", "GBP", "USD")
export type Currency = typeof Currency.Type

export const Money = Schema.Struct({
  amountMinor: Schema.Int,
  currency: Currency,
})
export type Money = typeof Money.Type

export const money = (amountMinor: number, currency: Currency): Money => ({
  amountMinor,
  currency,
})
