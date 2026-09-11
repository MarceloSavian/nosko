import { describe, expect, it } from "@jest/globals"
import { matchTransfers } from "./TransferMatcher"

describe("matchTransfers", () => {
  it("pairs a debit in one account with a same-amount credit in another within a few days", () => {
    const pairs = matchTransfers([
      {
        id: "debit-1",
        accountId: "acc-a",
        amountMinor: 10000,
        currency: "EUR",
        direction: "debit",
        bookedAt: new Date("2026-01-05"),
      },
      {
        id: "credit-1",
        accountId: "acc-b",
        amountMinor: 10000,
        currency: "EUR",
        direction: "credit",
        bookedAt: new Date("2026-01-06"),
      },
    ])

    expect(pairs).toEqual([{ debitId: "debit-1", creditId: "credit-1" }])
  })

  it("does not pair transactions in the same account", () => {
    const pairs = matchTransfers([
      {
        id: "debit-1",
        accountId: "acc-a",
        amountMinor: 10000,
        currency: "EUR",
        direction: "debit",
        bookedAt: new Date("2026-01-05"),
      },
      {
        id: "credit-1",
        accountId: "acc-a",
        amountMinor: 10000,
        currency: "EUR",
        direction: "credit",
        bookedAt: new Date("2026-01-05"),
      },
    ])
    expect(pairs).toEqual([])
  })

  it("does not pair across currencies or outside the gap window", () => {
    const pairs = matchTransfers([
      {
        id: "debit-1",
        accountId: "acc-a",
        amountMinor: 10000,
        currency: "EUR",
        direction: "debit",
        bookedAt: new Date("2026-01-01"),
      },
      {
        id: "credit-1",
        accountId: "acc-b",
        amountMinor: 10000,
        currency: "BRL",
        direction: "credit",
        bookedAt: new Date("2026-01-01"),
      },
      {
        id: "credit-2",
        accountId: "acc-b",
        amountMinor: 10000,
        currency: "EUR",
        direction: "credit",
        bookedAt: new Date("2026-01-10"),
      },
    ])
    expect(pairs).toEqual([])
  })

  it("does not reuse the same credit for two debits", () => {
    const pairs = matchTransfers([
      {
        id: "debit-1",
        accountId: "acc-a",
        amountMinor: 10000,
        currency: "EUR",
        direction: "debit",
        bookedAt: new Date("2026-01-05"),
      },
      {
        id: "debit-2",
        accountId: "acc-c",
        amountMinor: 10000,
        currency: "EUR",
        direction: "debit",
        bookedAt: new Date("2026-01-05"),
      },
      {
        id: "credit-1",
        accountId: "acc-b",
        amountMinor: 10000,
        currency: "EUR",
        direction: "credit",
        bookedAt: new Date("2026-01-05"),
      },
    ])
    expect(pairs).toEqual([{ debitId: "debit-1", creditId: "credit-1" }])
  })
})
