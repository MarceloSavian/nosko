import { createHash } from "node:crypto"

export interface DedupHashInput {
  readonly accountId: string
  readonly externalId: string | null
  readonly bookedAt: Date
  readonly description: string
  readonly amountMinor: number
  readonly direction: "debit" | "credit"
}

// externalId (e.g. Nubank's per-transaction UUID) is the strongest identity when the bank
// provides one; otherwise fall back to a composite of the fields most exports do provide, which
// is what "per-source identity" (FR-ING-2) means for banks without a stable id.
export const computeDedupHash = (input: DedupHashInput): string => {
  const key =
    input.externalId !== null
      ? `${input.accountId}:${input.externalId}`
      : `${input.accountId}:${input.bookedAt.toISOString().slice(0, 10)}:${input.description}:${input.amountMinor}:${input.direction}`
  return createHash("sha256").update(key).digest("hex")
}
