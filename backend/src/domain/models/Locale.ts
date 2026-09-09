import { Schema } from "effect"

export const Locale = Schema.Literal("en", "pt-BR")
export type Locale = typeof Locale.Type
