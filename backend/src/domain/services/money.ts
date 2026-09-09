import type { Money } from "@nosko/contracts"
import { Effect } from "effect"
import { CurrencyMismatch } from "../errors/CurrencyMismatch"

export const addMoney = (a: Money, b: Money): Effect.Effect<Money, CurrencyMismatch> =>
  a.currency === b.currency
    ? Effect.succeed({ amountMinor: a.amountMinor + b.amountMinor, currency: a.currency })
    : Effect.fail(new CurrencyMismatch({ left: a.currency, right: b.currency }))
