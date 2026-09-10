export interface TransactionCandidate {
  readonly matcher: string
  readonly amountMinor: number
  readonly currency: string
  readonly bookedAt: Date
}

export interface DetectedRule {
  readonly matcher: string
  readonly expectedAmountMinor: number
  readonly currency: string
  readonly cadence: "monthly"
  readonly confidence: number
}

const MIN_OCCURRENCES = 3
const AMOUNT_TOLERANCE = 0.05
const MIN_GAP_DAYS = 25
const MAX_GAP_DAYS = 35
const CONFIDENCE_SATURATION_OCCURRENCES = 6

const DAY_MS = 24 * 60 * 60 * 1000

const isMonthlyCadence = (sorted: ReadonlyArray<TransactionCandidate>): boolean => {
  for (let i = 1; i < sorted.length; i++) {
    const gapDays =
      ((sorted[i] as TransactionCandidate).bookedAt.getTime() -
        (sorted[i - 1] as TransactionCandidate).bookedAt.getTime()) /
      DAY_MS
    if (gapDays < MIN_GAP_DAYS || gapDays > MAX_GAP_DAYS) {
      return false
    }
  }
  return true
}

const isStableAmount = (sorted: ReadonlyArray<TransactionCandidate>): boolean => {
  const amounts = sorted.map((c) => c.amountMinor)
  const max = Math.max(...amounts)
  const min = Math.min(...amounts)
  if (max === 0) {
    return min === 0
  }
  return (max - min) / max <= AMOUNT_TOLERANCE
}

export const detectRecurring = (
  candidates: ReadonlyArray<TransactionCandidate>,
): ReadonlyArray<DetectedRule> => {
  const byMatcher = new Map<string, Array<TransactionCandidate>>()
  for (const candidate of candidates) {
    const group = byMatcher.get(candidate.matcher)
    if (group === undefined) {
      byMatcher.set(candidate.matcher, [candidate])
    } else {
      group.push(candidate)
    }
  }

  const rules: Array<DetectedRule> = []
  for (const [matcher, group] of byMatcher) {
    if (group.length < MIN_OCCURRENCES) {
      continue
    }
    const sorted = [...group].sort((a, b) => a.bookedAt.getTime() - b.bookedAt.getTime())
    if (!isMonthlyCadence(sorted) || !isStableAmount(sorted)) {
      continue
    }
    const amounts = sorted.map((c) => c.amountMinor)
    const expectedAmountMinor = Math.round(amounts.reduce((sum, a) => sum + a, 0) / amounts.length)
    const confidence = Math.min(1, sorted.length / CONFIDENCE_SATURATION_OCCURRENCES)

    rules.push({
      matcher,
      expectedAmountMinor,
      currency: (sorted[0] as TransactionCandidate).currency,
      cadence: "monthly",
      confidence,
    })
  }

  return rules
}
