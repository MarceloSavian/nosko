import { DateTime } from "effect"
import type { Locale } from "../i18n"

const intlLocale = (locale: Locale): string => (locale === "pt-BR" ? "pt-BR" : "en-US")

export const formatMoney = (amountMinor: number, currency: string, locale: Locale): string =>
  new Intl.NumberFormat(intlLocale(locale), { style: "currency", currency }).format(
    amountMinor / 100,
  )

export const formatPercent = (ratio: number, locale: Locale): string =>
  new Intl.NumberFormat(intlLocale(locale), { style: "percent", maximumFractionDigits: 1 }).format(
    ratio,
  )

export const formatDate = (value: DateTime.Utc, locale: Locale): string =>
  new Intl.DateTimeFormat(intlLocale(locale), { day: "2-digit", month: "short" }).format(
    DateTime.toDate(value),
  )
