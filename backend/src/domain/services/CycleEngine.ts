import type { IncomeKind, TransferDirection } from "../models/Cycle"

export interface CycleEngineIncome {
  readonly memberUserId: string
  readonly kind: IncomeKind
  readonly amountMinor: number
}

export interface CycleEngineTransfer {
  readonly direction: TransferDirection
  readonly amountMinor: number
}

export interface CycleEnginePrev {
  readonly variableTotal: number
  readonly surplus: number
}

export interface CycleEngineInput {
  readonly incomes: ReadonlyArray<CycleEngineIncome>
  readonly fixedTotal: number
  readonly reserveMinor: number
  readonly estimateMinor: number | null
  readonly seedOpeningBalanceMinor: number | null
  readonly prev: CycleEnginePrev | null
  readonly transfers: ReadonlyArray<CycleEngineTransfer>
  readonly variableTotal: number
  readonly cycleDays: number
  readonly daysUntilEnd: number
}

export interface ContributionShare {
  readonly memberUserId: string
  readonly share: number
}

export interface CycleFigures {
  readonly income: number
  readonly contributionShares: ReadonlyArray<ContributionShare>
  readonly fixedTotal: number
  readonly estimate: number
  readonly reserve: number
  readonly openingBalance: number
  readonly availableAfterPayments: number
  readonly withdrawalTotal: number
  readonly unallocated: number
  readonly available: number
  readonly variableTotal: number
  readonly totalSpent: number
  readonly surplus: number
  readonly variableBudget: number
  readonly savingsRate: number
  readonly dailyAllowance: number
}

export interface CycleWindow {
  readonly startDate: Date
  readonly endDate: Date
  readonly cycleKey: string
}

export const computeCycleWindow = (anchorDay: number, referenceDate: Date): CycleWindow => {
  const refDay = referenceDate.getUTCDate()
  const refYear = referenceDate.getUTCFullYear()
  const refMonth = referenceDate.getUTCMonth()
  const startsThisMonth = refDay >= anchorDay
  const startYear = startsThisMonth ? refYear : refMonth === 0 ? refYear - 1 : refYear
  const startMonth = startsThisMonth ? refMonth : refMonth === 0 ? 11 : refMonth - 1
  const startDate = new Date(Date.UTC(startYear, startMonth, anchorDay))
  const endMonth = startMonth === 11 ? 0 : startMonth + 1
  const endYear = startMonth === 11 ? startYear + 1 : startYear
  const endDate = new Date(Date.UTC(endYear, endMonth, anchorDay - 1))
  const cycleKey = `${startYear}-${String(startMonth + 1).padStart(2, "0")}`
  return { startDate, endDate, cycleKey }
}

export interface CategorySpend {
  readonly categoryId: string
  readonly spentMinor: number
  readonly capMinor: number | null
}

export const computeByCategory = (
  payments: ReadonlyArray<{ readonly categoryId: string; readonly amountBaseMinor: number }>,
  caps: ReadonlyArray<{ readonly categoryId: string; readonly capMinor: number }>,
): ReadonlyArray<CategorySpend> => {
  const spendByCategory = new Map<string, number>()
  for (const payment of payments) {
    spendByCategory.set(
      payment.categoryId,
      (spendByCategory.get(payment.categoryId) ?? 0) + payment.amountBaseMinor,
    )
  }
  const capByCategory = new Map(caps.map((cap) => [cap.categoryId, cap.capMinor]))
  const categoryIds = new Set([...spendByCategory.keys(), ...capByCategory.keys()])

  return [...categoryIds].map((categoryId) => ({
    categoryId,
    spentMinor: spendByCategory.get(categoryId) ?? 0,
    capMinor: capByCategory.get(categoryId) ?? null,
  }))
}

export const computeCycleFigures = (input: CycleEngineInput): CycleFigures => {
  const income = input.incomes.reduce((sum, i) => sum + i.amountMinor, 0)

  const salaryByMember = new Map<string, number>()
  for (const i of input.incomes) {
    if (i.kind === "salary") {
      salaryByMember.set(i.memberUserId, (salaryByMember.get(i.memberUserId) ?? 0) + i.amountMinor)
    }
  }
  const contributionShares: ReadonlyArray<ContributionShare> = [...salaryByMember.entries()].map(
    ([memberUserId, salary]) => ({
      memberUserId,
      share: income === 0 ? 0 : salary / income,
    }),
  )

  const estimate = input.estimateMinor ?? (input.prev !== null ? input.prev.variableTotal : 0)

  const reserve = input.reserveMinor

  const openingBalance =
    input.prev !== null ? input.prev.surplus : (input.seedOpeningBalanceMinor ?? 0)

  const availableAfterPayments = openingBalance + income - input.fixedTotal - estimate - reserve

  const withdrawalTotal = input.transfers.reduce(
    (sum, t) => sum + (t.direction === "to_personal" ? t.amountMinor : -t.amountMinor),
    0,
  )

  const unallocated = availableAfterPayments - withdrawalTotal
  const available = openingBalance + income - withdrawalTotal
  const totalSpent = input.fixedTotal + input.variableTotal
  const surplus = available - totalSpent
  const variableBudget = available - input.fixedTotal
  const savingsRate = income === 0 ? 0 : surplus / income
  const dailyAllowance = Math.round(
    (estimate - input.variableTotal) / Math.max(input.daysUntilEnd, 1),
  )

  return {
    income,
    contributionShares,
    fixedTotal: input.fixedTotal,
    estimate,
    reserve,
    openingBalance,
    availableAfterPayments,
    withdrawalTotal,
    unallocated,
    available,
    variableTotal: input.variableTotal,
    totalSpent,
    surplus,
    variableBudget,
    savingsRate,
    dailyAllowance,
  }
}
