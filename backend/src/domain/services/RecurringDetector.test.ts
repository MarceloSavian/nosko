import { describe, expect, it } from "@jest/globals"
import { detectRecurring } from "./RecurringDetector"

const day = (iso: string) => new Date(iso)

describe("detectRecurring", () => {
  it("proposes a rule for a matcher with stable monthly charges", () => {
    const result = detectRecurring([
      { matcher: "netflix", amountMinor: 10_000, currency: "EUR", bookedAt: day("2026-01-01") },
      { matcher: "netflix", amountMinor: 10_000, currency: "EUR", bookedAt: day("2026-01-31") },
      { matcher: "netflix", amountMinor: 10_000, currency: "EUR", bookedAt: day("2026-03-02") },
      { matcher: "netflix", amountMinor: 10_200, currency: "EUR", bookedAt: day("2026-04-01") },
    ])

    expect(result).toEqual([
      {
        matcher: "netflix",
        expectedAmountMinor: 10_050,
        currency: "EUR",
        cadence: "monthly",
        confidence: 4 / 6,
      },
    ])
  })

  it("ignores a matcher with fewer than three occurrences", () => {
    const result = detectRecurring([
      { matcher: "gym", amountMinor: 5_000, currency: "EUR", bookedAt: day("2026-01-01") },
      { matcher: "gym", amountMinor: 5_000, currency: "EUR", bookedAt: day("2026-01-31") },
    ])

    expect(result).toEqual([])
  })

  it("ignores a matcher whose charges don't land on a monthly cadence", () => {
    const result = detectRecurring([
      { matcher: "taxi", amountMinor: 2_000, currency: "EUR", bookedAt: day("2026-01-01") },
      { matcher: "taxi", amountMinor: 2_000, currency: "EUR", bookedAt: day("2026-01-11") },
      { matcher: "taxi", amountMinor: 2_000, currency: "EUR", bookedAt: day("2026-01-21") },
    ])

    expect(result).toEqual([])
  })

  it("ignores a matcher whose amount swings beyond the tolerance", () => {
    const result = detectRecurring([
      { matcher: "groceries", amountMinor: 10_000, currency: "EUR", bookedAt: day("2026-01-01") },
      { matcher: "groceries", amountMinor: 10_000, currency: "EUR", bookedAt: day("2026-01-31") },
      { matcher: "groceries", amountMinor: 20_000, currency: "EUR", bookedAt: day("2026-03-02") },
    ])

    expect(result).toEqual([])
  })

  it("treats an all-zero amount group as stable", () => {
    const result = detectRecurring([
      { matcher: "free-trial", amountMinor: 0, currency: "EUR", bookedAt: day("2026-01-01") },
      { matcher: "free-trial", amountMinor: 0, currency: "EUR", bookedAt: day("2026-01-31") },
      { matcher: "free-trial", amountMinor: 0, currency: "EUR", bookedAt: day("2026-03-02") },
    ])

    expect(result).toEqual([
      {
        matcher: "free-trial",
        expectedAmountMinor: 0,
        currency: "EUR",
        cadence: "monthly",
        confidence: 0.5,
      },
    ])
  })

  it("evaluates each matcher independently and caps confidence at 1", () => {
    const stableGroup = Array.from({ length: 8 }, (_, i) => ({
      matcher: "rent",
      amountMinor: 100_000,
      currency: "EUR",
      bookedAt: day(`2026-${String((i % 12) + 1).padStart(2, "0")}-01`),
    })).map((c, i) => ({ ...c, bookedAt: new Date(2026, i, 1) }))

    const result = detectRecurring([
      ...stableGroup,
      { matcher: "taxi", amountMinor: 2_000, currency: "EUR", bookedAt: day("2026-01-01") },
      { matcher: "taxi", amountMinor: 2_000, currency: "EUR", bookedAt: day("2026-01-11") },
      { matcher: "taxi", amountMinor: 2_000, currency: "EUR", bookedAt: day("2026-01-21") },
    ])

    expect(result).toEqual([
      {
        matcher: "rent",
        expectedAmountMinor: 100_000,
        currency: "EUR",
        cadence: "monthly",
        confidence: 1,
      },
    ])
  })
})
