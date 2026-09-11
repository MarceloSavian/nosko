import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { Transaction } from "./Transaction"

const now = new Date("2026-01-01T00:00:00.000Z")

const baseRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  accountId: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
  ownerUserId: "8c9e6679-7425-40de-944b-e07fc1f90aea",
  visibility: "personal",
  uploadId: null,
  externalId: null,
  bookedAt: now,
  description: "Mercado",
  counterparty: null,
  amountMinor: 5000,
  currency: "BRL",
  direction: "debit",
  categoryId: null,
  categoryConfidence: null,
  isTransfer: false,
  linkedTransactionId: null,
  matchedRuleId: null,
  status: "staged",
  sharedPaymentId: null,
  dedupHash: "hash",
  createdAt: now,
}

describe("Transaction", () => {
  it("decodes a staged personal transaction", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(Transaction)(baseRow))
    expect(decoded.status).toBe("staged")
    expect(decoded.visibility).toBe("personal")
  })

  it("decodes a confirmed shared transaction linked to a shared payment", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(Transaction)({
        ...baseRow,
        visibility: "shared",
        status: "confirmed",
        categoryId: "8c9e6679-7425-40de-944b-e07fc1f90aeb",
        categoryConfidence: 0.6,
        sharedPaymentId: "8c9e6679-7425-40de-944b-e07fc1f90aec",
      }),
    )
    expect(decoded.status).toBe("confirmed")
    expect(decoded.sharedPaymentId).not.toBeNull()
  })

  it("decodes a transfer-linked transaction", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(Transaction)({
        ...baseRow,
        isTransfer: true,
        linkedTransactionId: "8c9e6679-7425-40de-944b-e07fc1f90aed",
      }),
    )
    expect(decoded.isTransfer).toBe(true)
  })
})
