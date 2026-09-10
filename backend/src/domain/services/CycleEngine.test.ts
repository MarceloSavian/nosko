import { describe, expect, it } from "@jest/globals"
import { computeByCategory, computeCycleFigures, computeCycleWindow } from "./CycleEngine"

describe("computeByCategory", () => {
  it("sums spend per category and attaches its cap", () => {
    const result = computeByCategory(
      [
        { categoryId: "groceries", amountBaseMinor: 10_000 },
        { categoryId: "groceries", amountBaseMinor: 5_000 },
        { categoryId: "leisure", amountBaseMinor: 3_000 },
      ],
      [{ categoryId: "groceries", capMinor: 40_000 }],
    )

    expect(result).toEqual(
      expect.arrayContaining([
        { categoryId: "groceries", spentMinor: 15_000, capMinor: 40_000 },
        { categoryId: "leisure", spentMinor: 3_000, capMinor: null },
      ]),
    )
  })

  it("includes a capped category with no spend yet", () => {
    const result = computeByCategory([], [{ categoryId: "transport", capMinor: 20_000 }])

    expect(result).toEqual([{ categoryId: "transport", spentMinor: 0, capMinor: 20_000 }])
  })
})

describe("computeCycleWindow", () => {
  it("starts the previous month's cycle when today is before the anchor day", () => {
    const result = computeCycleWindow(23, new Date("2026-01-05T00:00:00.000Z"))
    expect(result.startDate.toISOString().slice(0, 10)).toBe("2025-12-23")
    expect(result.endDate.toISOString().slice(0, 10)).toBe("2026-01-22")
    expect(result.cycleKey).toBe("2025-12")
  })

  it("starts this month's cycle when today is on or after the anchor day", () => {
    const result = computeCycleWindow(23, new Date("2026-01-25T00:00:00.000Z"))
    expect(result.startDate.toISOString().slice(0, 10)).toBe("2026-01-23")
    expect(result.endDate.toISOString().slice(0, 10)).toBe("2026-02-22")
    expect(result.cycleKey).toBe("2026-01")
  })

  it("wraps the year boundary when the anchor cycle starts in December", () => {
    const result = computeCycleWindow(23, new Date("2026-12-25T00:00:00.000Z"))
    expect(result.startDate.toISOString().slice(0, 10)).toBe("2026-12-23")
    expect(result.endDate.toISOString().slice(0, 10)).toBe("2027-01-22")
    expect(result.cycleKey).toBe("2026-12")
  })

  it("steps back a month within the same year when today is before the anchor day", () => {
    const result = computeCycleWindow(23, new Date("2026-03-10T00:00:00.000Z"))
    expect(result.startDate.toISOString().slice(0, 10)).toBe("2026-02-23")
    expect(result.cycleKey).toBe("2026-02")
  })

  it("aligns to calendar months when the anchor day is 1", () => {
    const result = computeCycleWindow(1, new Date("2026-03-15T00:00:00.000Z"))
    expect(result.startDate.toISOString().slice(0, 10)).toBe("2026-03-01")
    expect(result.endDate.toISOString().slice(0, 10)).toBe("2026-03-31")
    expect(result.cycleKey).toBe("2026-03")
  })
})

describe("computeCycleFigures", () => {
  it("computes the first, seeded cycle", () => {
    const result = computeCycleFigures({
      incomes: [
        { memberUserId: "member-a", kind: "salary", amountMinor: 300_000 },
        { memberUserId: "member-b", kind: "salary", amountMinor: 200_000 },
      ],
      fixedTotal: 100_000,
      reserveMinor: 20_000,
      estimateMinor: 50_000,
      seedOpeningBalanceMinor: 10_000,
      prev: null,
      transfers: [
        { direction: "to_personal", amountMinor: 60_000 },
        { direction: "to_household", amountMinor: 10_000 },
      ],
      variableTotal: 40_000,
      cycleDays: 30,
      daysUntilEnd: 10,
    })

    expect(result.income).toBe(500_000)
    expect(result.contributionShares).toEqual([
      { memberUserId: "member-a", share: 0.6 },
      { memberUserId: "member-b", share: 0.4 },
    ])
    expect(result.estimate).toBe(50_000)
    expect(result.openingBalance).toBe(10_000)
    expect(result.availableAfterPayments).toBe(340_000)
    expect(result.withdrawalTotal).toBe(50_000)
    expect(result.unallocated).toBe(290_000)
    expect(result.available).toBe(460_000)
    expect(result.totalSpent).toBe(140_000)
    expect(result.surplus).toBe(320_000)
    expect(result.variableBudget).toBe(360_000)
    expect(result.savingsRate).toBeCloseTo(0.64)
    expect(result.dailyAllowance).toBe(1_000)
  })

  it("chains estimate and openingBalance off the previous cycle", () => {
    const result = computeCycleFigures({
      incomes: [{ memberUserId: "member-a", kind: "salary", amountMinor: 300_000 }],
      fixedTotal: 90_000,
      reserveMinor: 15_000,
      estimateMinor: null,
      seedOpeningBalanceMinor: null,
      prev: { variableTotal: 45_000, surplus: 320_000 },
      transfers: [],
      variableTotal: 50_000,
      cycleDays: 30,
      daysUntilEnd: 5,
    })

    expect(result.income).toBe(300_000)
    expect(result.contributionShares).toEqual([{ memberUserId: "member-a", share: 1 }])
    expect(result.estimate).toBe(45_000)
    expect(result.openingBalance).toBe(320_000)
    expect(result.availableAfterPayments).toBe(470_000)
    expect(result.withdrawalTotal).toBe(0)
    expect(result.available).toBe(620_000)
    expect(result.surplus).toBe(480_000)
    expect(result.variableBudget).toBe(530_000)
    expect(result.savingsRate).toBeCloseTo(1.6)
    expect(result.dailyAllowance).toBe(-1_000)
  })

  it("guards against division by zero income and a zero-length remaining window", () => {
    const result = computeCycleFigures({
      incomes: [],
      fixedTotal: 0,
      reserveMinor: 0,
      estimateMinor: 0,
      seedOpeningBalanceMinor: null,
      prev: null,
      transfers: [],
      variableTotal: 0,
      cycleDays: 30,
      daysUntilEnd: 0,
    })

    expect(result.income).toBe(0)
    expect(result.contributionShares).toEqual([])
    expect(result.openingBalance).toBe(0)
    expect(result.savingsRate).toBe(0)
    expect(result.dailyAllowance).toBe(0)
  })

  it("keeps a zero-income member's contribution share at zero instead of dividing by zero", () => {
    const result = computeCycleFigures({
      incomes: [{ memberUserId: "member-a", kind: "salary", amountMinor: 0 }],
      fixedTotal: 0,
      reserveMinor: 0,
      estimateMinor: 0,
      seedOpeningBalanceMinor: null,
      prev: null,
      transfers: [],
      variableTotal: 0,
      cycleDays: 30,
      daysUntilEnd: 30,
    })

    expect(result.contributionShares).toEqual([{ memberUserId: "member-a", share: 0 }])
  })

  it("falls back to a zero estimate on an unseeded first cycle", () => {
    const result = computeCycleFigures({
      incomes: [],
      fixedTotal: 0,
      reserveMinor: 0,
      estimateMinor: null,
      seedOpeningBalanceMinor: null,
      prev: null,
      transfers: [],
      variableTotal: 0,
      cycleDays: 30,
      daysUntilEnd: 30,
    })

    expect(result.estimate).toBe(0)
  })

  it("uses an explicit estimate over the chained one when both are available", () => {
    const result = computeCycleFigures({
      incomes: [{ memberUserId: "member-a", kind: "bonus", amountMinor: 100_000 }],
      fixedTotal: 10_000,
      reserveMinor: 0,
      estimateMinor: 25_000,
      seedOpeningBalanceMinor: null,
      prev: { variableTotal: 45_000, surplus: 0 },
      transfers: [],
      variableTotal: 0,
      cycleDays: 30,
      daysUntilEnd: 30,
    })

    expect(result.estimate).toBe(25_000)
    expect(result.contributionShares).toEqual([])
  })
})
