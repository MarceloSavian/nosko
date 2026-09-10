import { describe, expect, it } from "@jest/globals"
import { Effect, Layer } from "effect"
import { EcbFetcher } from "../../infra/fx/EcbFetcher"
import { makeFakeFxRatesRepository } from "../../test/fakeRepositories"
import { fetchAndStoreDailyRates } from "./FxRates"

const makeFakeEcbFetcher = (rates: ReadonlyArray<{ currency: string; rate: number }>) =>
  Layer.succeed(EcbFetcher, {
    fetchDailyRates: () => Effect.succeed(rates),
  })

describe("fetchAndStoreDailyRates", () => {
  it("stores only the supported quote currencies", async () => {
    const { layer: fxLayer, rates } = makeFakeFxRatesRepository()
    const ecbLayer = makeFakeEcbFetcher([
      { currency: "USD", rate: 1.1652 },
      { currency: "JPY", rate: 178.59 },
      { currency: "GBP", rate: 0.85898 },
      { currency: "BRL", rate: 5.9296 },
    ])

    const stored = await Effect.runPromise(
      fetchAndStoreDailyRates.pipe(Effect.provide(fxLayer), Effect.provide(ecbLayer)),
    )

    expect(stored).toHaveLength(3)
    expect(rates.map((r) => r.quote).sort()).toEqual(["BRL", "GBP", "USD"])
    expect(rates.every((r) => r.base === "EUR")).toBe(true)
  })

  it("stores nothing when the ECB feed has no supported currencies", async () => {
    const { layer: fxLayer, rates } = makeFakeFxRatesRepository()
    const ecbLayer = makeFakeEcbFetcher([{ currency: "JPY", rate: 178.59 }])

    await Effect.runPromise(
      fetchAndStoreDailyRates.pipe(Effect.provide(fxLayer), Effect.provide(ecbLayer)),
    )

    expect(rates).toHaveLength(0)
  })
})
