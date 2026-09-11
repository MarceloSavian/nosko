export interface TransferCandidate {
  readonly id: string
  readonly accountId: string
  readonly amountMinor: number
  readonly currency: string
  readonly direction: "debit" | "credit"
  readonly bookedAt: Date
}

export interface TransferPair {
  readonly debitId: string
  readonly creditId: string
}

const MAX_GAP_DAYS = 3
const DAY_MS = 24 * 60 * 60 * 1000

// Pairs a debit in one account with a credit of the same amount/currency in a different account
// within a few days — the common case (moving money between your own accounts, or a personal
// contribution into the joint account). Cross-currency transfers (e.g. Wise EUR->BRL) aren't
// matched yet since that needs an FX-rate-aware tolerance rather than an exact-amount match;
// those legs still surface individually in the review queue for manual handling.
export const matchTransfers = (
  candidates: ReadonlyArray<TransferCandidate>,
): ReadonlyArray<TransferPair> => {
  const debits = candidates.filter((c) => c.direction === "debit")
  const credits = candidates.filter((c) => c.direction === "credit")
  const usedCreditIds = new Set<string>()
  const pairs: Array<TransferPair> = []

  for (const debit of debits) {
    const match = credits.find(
      (credit) =>
        !usedCreditIds.has(credit.id) &&
        credit.accountId !== debit.accountId &&
        credit.currency === debit.currency &&
        credit.amountMinor === debit.amountMinor &&
        Math.abs(credit.bookedAt.getTime() - debit.bookedAt.getTime()) <= MAX_GAP_DAYS * DAY_MS,
    )
    if (match !== undefined) {
      usedCreditIds.add(match.id)
      pairs.push({ debitId: debit.id, creditId: match.id })
    }
  }

  return pairs
}
