import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { CycleDetailView, CycleFiguresView, CyclesRpcs, CycleView } from "./cycles"

const baseCycle = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  cycleKey: "2026-01",
  title: null,
  startDate: "2025-12-23T00:00:00.000Z",
  endDate: "2026-01-22T00:00:00.000Z",
  status: "open",
  closedAt: null,
  reserveMinor: 20_000,
  estimateMinor: null,
  seedOpeningBalanceMinor: null,
  surplusGoalId: null,
  surplusDestinationLabel: null,
}

const baseFigures = {
  income: 500_000,
  contributionShares: [{ memberUserId: "8c9e6679-7425-40de-944b-e07fc1f90ae8", share: 0.6 }],
  fixedTotal: 100_000,
  estimate: 50_000,
  reserve: 20_000,
  openingBalance: 10_000,
  availableAfterPayments: 340_000,
  withdrawalTotal: 50_000,
  unallocated: 290_000,
  available: 460_000,
  variableTotal: 40_000,
  totalSpent: 140_000,
  surplus: 320_000,
  variableBudget: 360_000,
  savingsRate: 0.64,
  dailyAllowance: 1_000,
}

describe("CycleView", () => {
  it("decodes a wire-shaped cycle", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(CycleView)(baseCycle))
    expect(decoded.cycleKey).toBe("2026-01")
  })
})

describe("CycleFiguresView / CycleDetailView", () => {
  it("decodes a full cycle detail", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(CycleDetailView)({
        cycle: baseCycle,
        figures: baseFigures,
        incomes: [],
        transfers: [],
        caps: [],
      }),
    )
    expect(decoded.figures.surplus).toBe(320_000)
  })

  it("decodes figures on their own", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(CycleFiguresView)(baseFigures))
    expect(decoded.contributionShares).toHaveLength(1)
  })
})

describe("CyclesRpcs", () => {
  it("declares every cycle action from the user stories", () => {
    expect([...CyclesRpcs.requests.keys()]).toEqual([
      "cycles.list",
      "cycles.get",
      "cycles.getCurrent",
      "cycles.create",
      "cycles.update",
      "cycles.close",
      "cycles.setIncome",
      "cycles.recordTransfer",
      "cycles.settleTransfer",
      "cycles.setCategoryCaps",
      "cycles.trends",
      "cycles.compare",
    ])
  })
})
