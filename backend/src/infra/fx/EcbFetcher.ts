import { Context, Data, Effect, Layer } from "effect"

export class EcbFetchError extends Data.TaggedError("EcbFetchError")<{
  readonly cause: unknown
}> {}

export interface EcbRate {
  readonly currency: string
  readonly rate: number
}

export class EcbFetcher extends Context.Tag("EcbFetcher")<
  EcbFetcher,
  {
    readonly fetchDailyRates: () => Effect.Effect<ReadonlyArray<EcbRate>, EcbFetchError>
  }
>() {}

const ECB_DAILY_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml"
const CUBE_PATTERN = /<Cube currency='([A-Z]{3})' rate='([\d.]+)'\/>/g

export const parseEcbDailyXml = (xml: string): ReadonlyArray<EcbRate> =>
  [...xml.matchAll(CUBE_PATTERN)].map(([, currency, rate]) => ({
    currency: currency as string,
    rate: Number.parseFloat(rate as string),
  }))

export const EcbFetcherLive = Layer.succeed(EcbFetcher, {
  fetchDailyRates: () =>
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(ECB_DAILY_URL)
        if (!response.ok) {
          throw new Error(`ECB feed responded with ${response.status}`)
        }
        return parseEcbDailyXml(await response.text())
      },
      catch: (cause) => new EcbFetchError({ cause }),
    }),
})
