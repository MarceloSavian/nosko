import { Schema } from "effect"

export class SharedPaymentNotFound extends Schema.TaggedError<SharedPaymentNotFound>(
  "SharedPaymentNotFound",
)("SharedPaymentNotFound", {}) {}

export class SharedAccountRequired extends Schema.TaggedError<SharedAccountRequired>(
  "SharedAccountRequired",
)("SharedAccountRequired", {}) {}

export class NoCycleForDate extends Schema.TaggedError<NoCycleForDate>("NoCycleForDate")(
  "NoCycleForDate",
  {},
) {}
