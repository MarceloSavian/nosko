import { Schema } from "effect"

export const CsvSignConvention = Schema.Literal("signed", "direction_column")
export type CsvSignConvention = typeof CsvSignConvention.Type

export const CsvDateFormat = Schema.Literal("DD/MM/YYYY", "YYYYMMDD", "YYYY-MM-DD HH:mm:ss")
export type CsvDateFormat = typeof CsvDateFormat.Type

// A bank's entire CSV shape as data, so adding or fixing a bank's export format is a migration,
// not a code change. One column-mapping config drives one generic parser (CsvParser.ts) instead
// of a bespoke parser module per institution.
export const CsvConfig = Schema.Struct({
  delimiter: Schema.Literal(",", ";"),
  dateColumn: Schema.String,
  dateFormat: CsvDateFormat,
  descriptionColumn: Schema.String,
  counterpartyColumn: Schema.NullOr(Schema.String),
  amountColumn: Schema.String,
  decimalSeparator: Schema.Literal(".", ","),
  signConvention: CsvSignConvention,
  // Only meaningful when signConvention is "direction_column": which column holds the
  // debit/credit marker, and which raw value in it means "credit".
  directionColumn: Schema.NullOr(Schema.String),
  creditDirectionValue: Schema.NullOr(Schema.String),
  externalIdColumn: Schema.NullOr(Schema.String),
  currencyColumn: Schema.NullOr(Schema.String),
  defaultCurrency: Schema.NullOr(Schema.String),
  // Rows whose filterColumn doesn't equal filterValue are skipped (e.g. Revolut's non-COMPLETED
  // rows).
  filterColumn: Schema.NullOr(Schema.String),
  filterValue: Schema.NullOr(Schema.String),
})
export type CsvConfig = typeof CsvConfig.Type

export const Bank = Schema.Struct({
  code: Schema.String,
  name: Schema.String,
  supportsCsv: Schema.Boolean,
  supportsPdf: Schema.Boolean,
  csvConfig: Schema.NullOr(CsvConfig),
  active: Schema.Boolean,
})
export type Bank = typeof Bank.Type
