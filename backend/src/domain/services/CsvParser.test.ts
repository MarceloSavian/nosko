import { describe, expect, it } from "@jest/globals"
import type { CsvConfig } from "../models/Bank"
import { parseCsv } from "./CsvParser"

const nubankConfig: CsvConfig = {
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

const ingConfig: CsvConfig = {
  delimiter: ";",
  dateColumn: "Date",
  dateFormat: "YYYYMMDD",
  descriptionColumn: "Name / Description",
  counterpartyColumn: "Counterparty",
  amountColumn: "Amount (EUR)",
  decimalSeparator: ",",
  signConvention: "direction_column",
  directionColumn: "Debit/credit",
  creditDirectionValue: "Credit",
  externalIdColumn: null,
  currencyColumn: null,
  defaultCurrency: "EUR",
  filterColumn: null,
  filterValue: null,
}

const revolutConfig: CsvConfig = {
  delimiter: ",",
  dateColumn: "Started Date",
  dateFormat: "YYYY-MM-DD HH:mm:ss",
  descriptionColumn: "Description",
  counterpartyColumn: null,
  amountColumn: "Amount",
  decimalSeparator: ".",
  signConvention: "signed",
  directionColumn: null,
  creditDirectionValue: null,
  externalIdColumn: null,
  currencyColumn: "Currency",
  defaultCurrency: null,
  filterColumn: "State",
  filterValue: "COMPLETED",
}

describe("parseCsv", () => {
  it("parses a Nubank-shaped export (signed amount, external id, no header quoting)", () => {
    const csv = [
      "Data,Valor,Identificador,Descrição",
      "04/01/2026,120.50,abc-123,Transferência recebida pelo Pix - Fulano",
      "05/01/2026,-45.90,def-456,Mercado Central",
    ].join("\n")

    const rows = parseCsv(csv, nubankConfig)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      externalId: "abc-123",
      bookedAt: new Date(Date.UTC(2026, 0, 4)),
      description: "Transferência recebida pelo Pix - Fulano",
      counterparty: null,
      amountMinor: 12050,
      currency: "BRL",
      direction: "credit",
    })
    expect(rows[1]).toMatchObject({ amountMinor: 4590, direction: "debit" })
  })

  it("parses an ING-shaped export (quoted fields, semicolon delimiter, direction column)", () => {
    const csv = [
      '"Date";"Name / Description";"Account";"Counterparty";"Code";"Debit/credit";"Amount (EUR)";"Transaction type";"Notifications";"Resulting balance";"Tag"',
      '"20260115";"Some Shop B.V.";"NL01BANK0000000001";"";"BA";"Debit";"12,34";"Payment terminal";"";"500,00";""',
      '"20260116";"Employer Payroll";"NL01BANK0000000001";"NL02BANK0000000002";"IC";"Credit";"2.500,00";"SEPA credit transfer";"";"3000,00";""',
    ].join("\n")

    const rows = parseCsv(csv, ingConfig)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      externalId: null,
      bookedAt: new Date(Date.UTC(2026, 0, 15)),
      description: "Some Shop B.V.",
      counterparty: null,
      amountMinor: 1234,
      currency: "EUR",
      direction: "debit",
    })
    expect(rows[1]).toEqual({
      externalId: null,
      bookedAt: new Date(Date.UTC(2026, 0, 16)),
      description: "Employer Payroll",
      counterparty: "NL02BANK0000000002",
      amountMinor: 250000,
      currency: "EUR",
      direction: "credit",
    })
  })

  it("parses a Revolut-shaped export and skips non-COMPLETED rows", () => {
    const csv = [
      "Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance",
      "Deposit,Current,2026-01-28 12:54:57,2026-01-28 12:55:27,Money added,20,0,EUR,COMPLETED,20",
      "Transfer,Current,2026-01-29 09:00:00,,Pending transfer,-5,0,EUR,PENDING,15",
    ].join("\n")

    const rows = parseCsv(csv, revolutConfig)

    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      externalId: null,
      bookedAt: new Date(Date.UTC(2026, 0, 28)),
      description: "Money added",
      counterparty: null,
      amountMinor: 2000,
      currency: "EUR",
      direction: "credit",
    })
  })

  it("returns an empty array for a header-only or empty file", () => {
    expect(parseCsv("", nubankConfig)).toEqual([])
    expect(parseCsv("Data,Valor,Identificador,Descrição", nubankConfig)).toEqual([])
  })

  it("unescapes a doubled quote inside a quoted field", () => {
    const csv = [
      '"Date";"Name / Description";"Account";"Counterparty";"Code";"Debit/credit";"Amount (EUR)";"Transaction type";"Notifications";"Resulting balance";"Tag"',
      '"20260115";"He said ""hi"" to me";"NL01BANK0000000001";"";"BA";"Debit";"1,00";"";"";"";""',
    ].join("\n")

    const rows = parseCsv(csv, ingConfig)
    expect(rows[0]?.description).toBe('He said "hi" to me')
  })

  it("falls back to the default currency when a currency column is present but blank", () => {
    const csv = [
      "Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance",
      "Deposit,Current,2026-01-28 12:54:57,2026-01-28 12:55:27,Money added,20,0,,COMPLETED,20",
    ].join("\n")

    const rows = parseCsv(csv, { ...revolutConfig, defaultCurrency: "EUR" })
    expect(rows[0]?.currency).toBe("EUR")
  })

  it("falls back to EUR when there's neither a currency column nor a default currency", () => {
    const csv = ["Data,Valor,Identificador,Descrição", "05/01/2026,10.00,ext-1,Mercado"].join("\n")
    const rows = parseCsv(csv, { ...nubankConfig, defaultCurrency: null })
    expect(rows[0]?.currency).toBe("EUR")
  })

  it("doesn't crash on a malformed row missing trailing fields", () => {
    // A row shorter than the header (a truncated export line): every optional/trailing lookup
    // must fall back gracefully instead of throwing.
    const csv = ["Data,Valor,Identificador,Descrição", ","].join("\n")
    const rows = parseCsv(csv, nubankConfig)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.externalId).toBeNull()
    expect(rows[0]?.description).toBe("")
  })

  it("doesn't crash when a row has only its first column", () => {
    const csv = ["Data,Valor,Identificador,Descrição", "05/01/2026"].join("\n")
    const rows = parseCsv(csv, nubankConfig)
    expect(Number.isNaN(rows[0]?.amountMinor)).toBe(true)
  })

  it("falls back to the epoch when a configured column name isn't in the header at all", () => {
    // A bank changing its export's column names shouldn't crash the parser — it should just fail
    // to find that field for every row, gracefully.
    const csv = ["Data,Valor,Identificador,Descrição", "05/01/2026,10.00,ext-1,Mercado"].join("\n")
    const rows = parseCsv(csv, { ...nubankConfig, dateColumn: "Data da Transação" })
    expect(rows[0]?.bookedAt).toEqual(new Date(Date.UTC(1970, 0, 1)))
  })

  it("returns a null counterparty for an ING row shorter than the counterparty column", () => {
    const csv = [
      '"Date";"Name / Description";"Account";"Counterparty";"Code";"Debit/credit";"Amount (EUR)";"Transaction type";"Notifications";"Resulting balance";"Tag"',
      '"20260115";"Some Shop"',
    ].join("\n")
    const rows = parseCsv(csv, ingConfig)
    expect(rows[0]?.counterparty).toBeNull()
  })

  it("falls back to the epoch when a date field is empty, for every date format", () => {
    const ddmmyyyy = parseCsv(
      ["Data,Valor,Identificador,Descrição", ",10.00,ext-1,Mercado"].join("\n"),
      nubankConfig,
    )
    expect(ddmmyyyy[0]?.bookedAt).toEqual(new Date(Date.UTC(1970, 0, 1)))

    const isoWithTime = parseCsv(
      [
        "Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance",
        "Deposit,Current,,2026-01-28 12:55:27,Money added,20,0,EUR,COMPLETED,20",
      ].join("\n"),
      revolutConfig,
    )
    expect(isoWithTime[0]?.bookedAt).toEqual(new Date(Date.UTC(1970, 0, 1)))
  })
})
