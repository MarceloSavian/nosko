import { Schema } from "effect"

export class CurrencyMismatch extends Schema.TaggedError<CurrencyMismatch>("CurrencyMismatch")(
  "CurrencyMismatch",
  { left: Schema.String, right: Schema.String },
) {}
