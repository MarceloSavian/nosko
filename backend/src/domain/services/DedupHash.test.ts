import { describe, expect, it } from "@jest/globals"
import { computeDedupHash } from "./DedupHash"

describe("computeDedupHash", () => {
  it("is stable for the same input", () => {
    const input = {
      accountId: "acc-1",
      externalId: "ext-1",
      bookedAt: new Date("2026-01-05"),
      description: "Mercado",
      amountMinor: 5000,
      direction: "debit" as const,
    }
    expect(computeDedupHash(input)).toBe(computeDedupHash(input))
  })

  it("differs when the external id differs, even if everything else matches", () => {
    const base = {
      accountId: "acc-1",
      bookedAt: new Date("2026-01-05"),
      description: "Mercado",
      amountMinor: 5000,
      direction: "debit" as const,
    }
    const a = computeDedupHash({ ...base, externalId: "ext-1" })
    const b = computeDedupHash({ ...base, externalId: "ext-2" })
    expect(a).not.toBe(b)
  })

  it("falls back to a composite of account/date/description/amount/direction without an external id", () => {
    const base = {
      accountId: "acc-1",
      externalId: null,
      bookedAt: new Date("2026-01-05"),
      description: "Mercado",
      amountMinor: 5000,
      direction: "debit" as const,
    }
    expect(computeDedupHash(base)).toBe(computeDedupHash({ ...base }))
    expect(computeDedupHash(base)).not.toBe(computeDedupHash({ ...base, amountMinor: 5001 }))
    expect(computeDedupHash(base)).not.toBe(computeDedupHash({ ...base, direction: "credit" }))
  })
})
