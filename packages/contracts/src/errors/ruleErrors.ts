import { Schema } from "effect"

export class RecurringRuleNotFound extends Schema.TaggedError<RecurringRuleNotFound>(
  "RecurringRuleNotFound",
)("RecurringRuleNotFound", {}) {}
