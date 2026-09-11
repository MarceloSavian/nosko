import { describe, expect, it } from "@jest/globals"
import { Effect } from "effect"
import { BanksRepository } from "../../data/protocols/BanksRepository"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { BanksRepositoryLive } from "./BanksRepositoryLive"

const nubankRow = {
  code: "nubank",
  name: "Nubank",
  supports_csv: true,
  supports_pdf: false,
  csv_config: {
    delimiter: ",",
    dateColumn: "Data",
    dateFormat: "DD/MM/YYYY",
    descriptionColumn: "Descrição",
    counterpartyColumn: null,
    amountColumn: "Valor",
    decimalSeparator: ".",
    signConvention: "signed",
    directionColumn: null,
    creditDirectionValue: null,
    externalIdColumn: "Identificador",
    currencyColumn: null,
    defaultCurrency: "BRL",
    filterColumn: null,
    filterValue: null,
  },
  active: true,
}

const otherRow = {
  code: "other",
  name: "Other",
  supports_csv: false,
  supports_pdf: false,
  csv_config: null,
  active: true,
}

describe("BanksRepositoryLive", () => {
  it("finds a bank by code", async () => {
    const { layer, queries } = makeTestSqlClient(() => [nubankRow])

    const found = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* BanksRepository
        return yield* repo.findByCode("nubank")
      }).pipe(Effect.provide(BanksRepositoryLive), Effect.provide(layer)),
    )

    expect(found._tag).toBe("Some")
    if (found._tag === "Some") {
      expect(found.value.csvConfig?.dateFormat).toBe("DD/MM/YYYY")
    }
    expect(queries[0]?.sql).toBe('SELECT * FROM "banks" WHERE "code" = $1')
  })

  it("returns None for an unknown code", async () => {
    const { layer } = makeTestSqlClient(() => [])

    const found = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* BanksRepository
        return yield* repo.findByCode("unknown")
      }).pipe(Effect.provide(BanksRepositoryLive), Effect.provide(layer)),
    )

    expect(found._tag).toBe("None")
  })

  it("lists all banks", async () => {
    const { layer, queries } = makeTestSqlClient(() => [nubankRow, otherRow])

    const list = await Effect.runPromise(
      Effect.gen(function* () {
        const repo = yield* BanksRepository
        return yield* repo.list()
      }).pipe(Effect.provide(BanksRepositoryLive), Effect.provide(layer)),
    )

    expect(list).toHaveLength(2)
    expect(queries[0]?.sql).toBe('SELECT * FROM "banks" ORDER BY "name"')
  })
})
