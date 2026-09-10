import { Schema } from "effect"

export class FixedBillNotFound extends Schema.TaggedError<FixedBillNotFound>("FixedBillNotFound")(
  "FixedBillNotFound",
  {},
) {}
