import type { Currency, Money } from "@nosko/contracts"
import { Effect } from "effect"
import { NoFxRate } from "../errors/FxErrors"

export interface FxConversionResult {
  readonly amountBase: Money
  readonly rate: number
}

export const convertToBase = (
  money: Money,
  baseCurrency: Currency,
  rate: { readonly rate: number } | null,
): Effect.Effect<FxConversionResult, NoFxRate> => {
  if (money.currency === baseCurrency) {
    return Effect.succeed({ amountBase: money, rate: 1 })
  }
  if (rate === null) {
    return Effect.fail(new NoFxRate({ base: baseCurrency, quote: money.currency }))
  }
  return Effect.succeed({
    amountBase: {
      amountMinor: Math.round(money.amountMinor / rate.rate),
      currency: baseCurrency,
    },
    rate: rate.rate,
  })
}
