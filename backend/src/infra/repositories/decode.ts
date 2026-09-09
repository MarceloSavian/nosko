import { Effect, Schema } from "effect"

export const decodeRow =
  <A, I, R>(schema: Schema.Schema<A, I, R>) =>
  (row: unknown): Effect.Effect<A, never, R> =>
    Schema.decodeUnknown(schema)(row).pipe(Effect.orDie)
