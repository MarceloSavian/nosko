import { Effect } from "effect"
import { EcbFetcher } from "../../infra/fx/EcbFetcher"
import { FxRatesRepository } from "../protocols/FxRatesRepository"

const SUPPORTED_QUOTE_CURRENCIES: ReadonlySet<string> = new Set(["BRL", "GBP", "USD"])

export const fetchAndStoreDailyRates = Effect.gen(function* () {
  const fetcher = yield* EcbFetcher
  const repository = yield* FxRatesRepository

  const rates = yield* fetcher.fetchDailyRates()
  const relevant = rates.filter((rate) => SUPPORTED_QUOTE_CURRENCIES.has(rate.currency))
  const rateDate = new Date()

  return yield* Effect.forEach(relevant, (rate) =>
    repository.upsert({ rateDate, base: "EUR", quote: rate.currency, rate: rate.rate }),
  )
})
