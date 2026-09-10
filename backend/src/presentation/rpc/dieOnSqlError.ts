import type { SqlError } from "@effect/sql/SqlError"
import { Effect } from "effect"

export const dieOnSqlError = <A, E, R>(effect: Effect.Effect<A, E | SqlError, R>) =>
  effect.pipe(Effect.catchTag("SqlError", (error) => Effect.die(error)))
