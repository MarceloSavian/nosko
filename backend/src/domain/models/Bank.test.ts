import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { Bank, CsvConfig } from "./Bank"

const csvConfigRow = {
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
}

describe("Bank", () => {
  it("decodes a bank with a CSV config", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(Bank)({
        code: "nubank",
        name: "Nubank",
        supportsCsv: true,
        supportsPdf: false,
        csvConfig: csvConfigRow,
        active: true,
      }),
    )
    expect(decoded.csvConfig?.dateFormat).toBe("DD/MM/YYYY")
  })

  it("decodes a bank with no CSV config (PDF-only or manual-only)", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(Bank)({
        code: "amex",
        name: "American Express",
        supportsCsv: false,
        supportsPdf: true,
        csvConfig: null,
        active: true,
      }),
    )
    expect(decoded.csvConfig).toBeNull()
  })

  it("decodes a CsvConfig on its own", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(CsvConfig)(csvConfigRow))
    expect(decoded.signConvention).toBe("signed")
  })
})
