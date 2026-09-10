import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { PaymentsRpcs, PaymentsSummaryView, SharedPaymentView } from "./payments"

const basePayment = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  cycleId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  accountId: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
  bookedAt: "2026-01-05T00:00:00.000Z",
  description: "Mercado",
  counterparty: null,
  amountMinor: 10_000,
  currency: "EUR",
  amountBaseMinor: 10_000,
  fxRate: null,
  categoryId: "8c9e6679-7425-40de-944b-e07fc1f90aea",
}

describe("SharedPaymentView", () => {
  it("decodes a wire-shaped shared payment", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(SharedPaymentView)(basePayment))
    expect(decoded.description).toBe("Mercado")
  })
})

describe("PaymentsSummaryView", () => {
  it("decodes a summary with per-category spend", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(PaymentsSummaryView)({
        cycleTotalMinor: 40_000,
        estimateMinor: 50_000,
        averagePerDayMinor: 1_300,
        byCategory: [{ categoryId: basePayment.categoryId, spentMinor: 10_000, capMinor: 20_000 }],
      }),
    )
    expect(decoded.byCategory).toHaveLength(1)
  })
})

describe("PaymentsRpcs", () => {
  it("declares every shared-payment action from the user stories", () => {
    expect([...PaymentsRpcs.requests.keys()]).toEqual([
      "payments.list",
      "payments.create",
      "payments.update",
      "payments.remove",
      "payments.summary",
    ])
  })
})
