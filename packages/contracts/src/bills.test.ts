import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { BillsRpcs, FixedBillView } from "./bills"

const baseBill = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  cycleId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  recurringRuleId: null,
  label: "Aluguel",
  amountMinor: 150_000,
  currency: "EUR",
  paid: false,
  paidOnDay: null,
  payingAccountId: null,
  dueDay: 5,
  autoPaid: false,
  categoryId: null,
  sortOrder: 0,
}

describe("FixedBillView", () => {
  it("decodes a wire-shaped fixed bill", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(FixedBillView)(baseBill))
    expect(decoded.label).toBe("Aluguel")
  })
})

describe("BillsRpcs", () => {
  it("declares every fixed-bill action from the user stories", () => {
    expect([...BillsRpcs.requests.keys()]).toEqual([
      "bills.list",
      "bills.create",
      "bills.update",
      "bills.setPaid",
      "bills.remove",
    ])
  })
})
