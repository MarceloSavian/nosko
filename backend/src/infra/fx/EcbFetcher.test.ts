import { afterEach, describe, expect, it, jest } from "@jest/globals"
import { Effect } from "effect"
import { EcbFetcher, EcbFetcherLive, parseEcbDailyXml } from "./EcbFetcher"

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
	<Cube>
		<Cube time='2026-09-09'>
			<Cube currency='USD' rate='1.1652'/>
			<Cube currency='GBP' rate='0.85898'/>
			<Cube currency='BRL' rate='5.9296'/>
		</Cube>
	</Cube>
</gesmes:Envelope>`

describe("parseEcbDailyXml", () => {
  it("extracts every currency/rate pair", () => {
    expect(parseEcbDailyXml(SAMPLE_XML)).toEqual([
      { currency: "USD", rate: 1.1652 },
      { currency: "GBP", rate: 0.85898 },
      { currency: "BRL", rate: 5.9296 },
    ])
  })

  it("returns an empty array when there are no rates", () => {
    expect(parseEcbDailyXml("<Cube><Cube time='2026-09-09'></Cube></Cube>")).toEqual([])
  })
})

describe("EcbFetcherLive", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("fetches and parses the daily rates", async () => {
    global.fetch = jest.fn(async () => new Response(SAMPLE_XML, { status: 200 })) as typeof fetch

    const rates = await Effect.runPromise(
      Effect.gen(function* () {
        const fetcher = yield* EcbFetcher
        return yield* fetcher.fetchDailyRates()
      }).pipe(Effect.provide(EcbFetcherLive)),
    )

    expect(rates).toHaveLength(3)
    expect(rates[2]).toEqual({ currency: "BRL", rate: 5.9296 })
  })

  it("fails with EcbFetchError on a non-ok response", async () => {
    global.fetch = jest.fn(async () => new Response("not found", { status: 404 })) as typeof fetch

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const fetcher = yield* EcbFetcher
        return yield* fetcher.fetchDailyRates()
      }).pipe(Effect.provide(EcbFetcherLive)),
    )

    expect(exit._tag).toBe("Failure")
  })

  it("fails with EcbFetchError when the request itself rejects", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("network down")
    }) as typeof fetch

    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const fetcher = yield* EcbFetcher
        return yield* fetcher.fetchDailyRates()
      }).pipe(Effect.provide(EcbFetcherLive)),
    )

    expect(exit._tag).toBe("Failure")
  })
})
