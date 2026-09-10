import { LambdaHandler } from "@effect-aws/lambda"
import { Layer } from "effect"
import { fetchAndStoreDailyRates } from "../data/usecases/FxRates"
import { PgLive } from "../infra/config/DatabaseConfig"
import { EcbFetcherLive } from "../infra/fx/EcbFetcher"
import { FxRatesRepositoryLive } from "../infra/repositories/FxRatesRepositoryLive"

const AppLive = Layer.mergeAll(FxRatesRepositoryLive, EcbFetcherLive).pipe(Layer.provide(PgLive))

export const handler = LambdaHandler.make({
  handler: () => fetchAndStoreDailyRates,
  layer: AppLive,
})
