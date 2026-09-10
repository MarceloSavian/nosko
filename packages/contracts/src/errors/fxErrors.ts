import { Schema } from "effect"

export class NoFxRate extends Schema.TaggedError<NoFxRate>("NoFxRate")("NoFxRate", {
  base: Schema.String,
  quote: Schema.String,
}) {}
