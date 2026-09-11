import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

// Bank CSV shapes as data (see domain/models/Bank.ts's CsvConfig) so a new or fixed bank export
// format is a migration, not a code change. Column mappings below were derived from real sample
// exports (ING, Nubank, Revolut) rather than guessed. Amex/C6 are PDF-only and have no parser yet
// (csv_config null) — importing them falls back to manual entry (U9); 'abn'/'other' are manual
// only by design.
const nubankCsvConfig = {
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

const ingCsvConfig = {
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

const revolutCsvConfig = {
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

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`
    CREATE TABLE banks (
      code text PRIMARY KEY,
      name text NOT NULL,
      supports_csv boolean NOT NULL DEFAULT false,
      supports_pdf boolean NOT NULL DEFAULT false,
      csv_config jsonb,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  // Reference/config data, not household- or user-owned — read-only to the app, no RLS needed.
  yield* sql.unsafe(`GRANT SELECT ON banks TO app_role`)

  const banks: ReadonlyArray<{
    readonly code: string
    readonly name: string
    readonly supportsCsv: boolean
    readonly supportsPdf: boolean
    readonly csvConfig: Record<string, unknown> | null
  }> = [
    {
      code: "nubank",
      name: "Nubank",
      supportsCsv: true,
      supportsPdf: false,
      csvConfig: nubankCsvConfig,
    },
    { code: "ing", name: "ING", supportsCsv: true, supportsPdf: false, csvConfig: ingCsvConfig },
    {
      code: "revolut",
      name: "Revolut",
      supportsCsv: true,
      supportsPdf: false,
      csvConfig: revolutCsvConfig,
    },
    {
      code: "amex",
      name: "American Express",
      supportsCsv: false,
      supportsPdf: true,
      csvConfig: null,
    },
    { code: "c6", name: "C6 Bank", supportsCsv: false, supportsPdf: true, csvConfig: null },
    { code: "abn", name: "ABN AMRO", supportsCsv: false, supportsPdf: false, csvConfig: null },
    { code: "other", name: "Other", supportsCsv: false, supportsPdf: false, csvConfig: null },
  ]

  for (const bank of banks) {
    const configLiteral =
      bank.csvConfig === null
        ? "NULL"
        : `'${JSON.stringify(bank.csvConfig).replace(/'/g, "''")}'::jsonb`
    yield* sql.unsafe(`
      INSERT INTO banks (code, name, supports_csv, supports_pdf, csv_config)
      VALUES ('${bank.code}', '${bank.name.replace(/'/g, "''")}', ${bank.supportsCsv}, ${bank.supportsPdf}, ${configLiteral})
    `)
  }
})
