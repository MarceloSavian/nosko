import type { CsvConfig, CsvDateFormat } from "../models/Bank"

export interface ParsedCsvRow {
  readonly externalId: string | null
  readonly bookedAt: Date
  readonly description: string
  readonly counterparty: string | null
  readonly amountMinor: number
  readonly currency: string
  readonly direction: "debit" | "credit"
}

// Handles quoted fields (with escaped "" inside quotes) and a configurable delimiter — the two
// things that differ across the sample bank exports (ING/Wise quote every field and use ";",
// Nubank/Revolut don't quote and use ",").
const splitCsvLine = (line: string, delimiter: string): Array<string> => {
  const fields: Array<string> = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      fields.push(current)
      current = ""
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

const parseDate = (raw: string, format: CsvDateFormat): Date => {
  if (format === "DD/MM/YYYY") {
    const [d, m, y] = raw.split("/").map(Number)
    // "||" not "??": Number("") is 0, not undefined, and 0 is never a valid day/month/year here.
    return new Date(Date.UTC(y || 1970, (m || 1) - 1, d || 1))
  }
  if (format === "YYYYMMDD") {
    const y = Number(raw.slice(0, 4))
    const m = Number(raw.slice(4, 6))
    const d = Number(raw.slice(6, 8))
    return new Date(Date.UTC(y, m - 1, d))
  }
  // String.split never returns an empty array, so datePart is always defined.
  const datePart = raw.split(" ")[0] as string
  const [y, m, d] = datePart.split("-").map(Number)
  return new Date(Date.UTC(y || 1970, (m || 1) - 1, d || 1))
}

const parseSignedAmount = (raw: string, decimalSeparator: "." | ","): number => {
  const normalized =
    decimalSeparator === "," ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "")
  return Number.parseFloat(normalized)
}

export const parseCsv = (text: string, config: CsvConfig): ReadonlyArray<ParsedCsvRow> => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "")
  if (lines.length === 0) return []

  const header = splitCsvLine(lines[0] as string, config.delimiter).map((h) => h.trim())
  const indexOf = (name: string | null): number => (name === null ? -1 : header.indexOf(name))

  const dateIdx = indexOf(config.dateColumn)
  const descriptionIdx = indexOf(config.descriptionColumn)
  const counterpartyIdx = indexOf(config.counterpartyColumn)
  const amountIdx = indexOf(config.amountColumn)
  const directionIdx = indexOf(config.directionColumn)
  const externalIdIdx = indexOf(config.externalIdColumn)
  const currencyIdx = indexOf(config.currencyColumn)
  const filterIdx = indexOf(config.filterColumn)

  const rows: Array<ParsedCsvRow> = []
  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line, config.delimiter)

    if (filterIdx >= 0 && fields[filterIdx]?.trim() !== config.filterValue) {
      continue
    }

    const signedAmount = parseSignedAmount(fields[amountIdx] ?? "", config.decimalSeparator)
    const direction: "debit" | "credit" =
      config.signConvention === "direction_column"
        ? fields[directionIdx]?.trim() === config.creditDirectionValue
          ? "credit"
          : "debit"
        : signedAmount < 0
          ? "debit"
          : "credit"

    rows.push({
      externalId: externalIdIdx >= 0 ? (fields[externalIdIdx]?.trim() ?? null) || null : null,
      bookedAt: parseDate((fields[dateIdx] ?? "").trim(), config.dateFormat),
      description: (fields[descriptionIdx] ?? "").trim(),
      counterparty: counterpartyIdx >= 0 ? (fields[counterpartyIdx]?.trim() ?? null) || null : null,
      amountMinor: Math.round(Math.abs(signedAmount) * 100),
      currency:
        (currencyIdx >= 0 ? fields[currencyIdx]?.trim() : undefined) ||
        config.defaultCurrency ||
        "EUR",
      direction,
    })
  }
  return rows
}
