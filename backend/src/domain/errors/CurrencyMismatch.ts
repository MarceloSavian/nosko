import { Data } from "effect"

export class CurrencyMismatch extends Data.TaggedError("CurrencyMismatch")<{
  readonly left: string
  readonly right: string
}> {}
