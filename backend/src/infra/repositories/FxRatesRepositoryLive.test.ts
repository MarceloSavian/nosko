import { describe, expect, it } from "@jest/globals"
import { Effect, Option } from "effect"
import { FxRatesRepository } from "../../data/protocols/FxRatesRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { FxRatesRepositoryLive } from "./FxRatesRepositoryLive"

const rateRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  rate_date: new Date("2026-01-01T00:00:00.000Z"),
  base: "EUR",
  quote: "BRL",
  rate: 5.43,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
}

describe("FxRatesRepositoryLive", () => {
  it("upserts a rate", async () => {
    const { layer, queries } = makeTestSqlClient(() => [rateRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* FxRatesRepository
        return yield* repo.upsert({
          rateDate: rateRow.rate_date,
          base: "EUR",
          quote: "BRL",
          rate: 5.43,
        })
      }).pipe(Effect.provide(FxRatesRepositoryLive), Effect.provide(layer)),
    )

    expect(decoded.rate).toBe(5.43)
    expect(queries[0]?.sql).toContain("ON CONFLICT (rate_date, base, quote) DO UPDATE")
  })

  it("finds the rate on or before a date, most recent first", async () => {
    const { layer, queries } = makeTestSqlClient(() => [rateRow])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* FxRatesRepository
        return yield* repo.findOnOrBefore("EUR", "BRL", new Date("2026-01-15T00:00:00.000Z"))
      }).pipe(Effect.provide(FxRatesRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isSome(decoded)).toBe(true)
    expect(queries[0]?.sql).toContain('"rate_date" <= $3')
    expect(queries[0]?.sql).toContain('ORDER BY "rate_date" DESC')
  })

  it("returns none when there is no rate on or before the date", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const decoded = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* FxRatesRepository
        return yield* repo.findOnOrBefore("EUR", "BRL", new Date("2020-01-01T00:00:00.000Z"))
      }).pipe(Effect.provide(FxRatesRepositoryLive), Effect.provide(layer)),
    )

    expect(Option.isNone(decoded)).toBe(true)
  })
})
