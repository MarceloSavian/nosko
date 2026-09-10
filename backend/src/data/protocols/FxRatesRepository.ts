import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type { FxRate, NewFxRate } from "../../domain/models/FxRate"

export class FxRatesRepository extends Context.Tag("FxRatesRepository")<
  FxRatesRepository,
  {
    readonly upsert: (input: NewFxRate) => Effect.Effect<FxRate, SqlError>
    readonly findOnOrBefore: (
      base: string,
      quote: string,
      date: Date,
    ) => Effect.Effect<Option.Option<FxRate>, SqlError>
  }
>() {}
