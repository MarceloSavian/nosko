import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect } from "effect"
import type { CategoryCap } from "../../domain/models/CategoryCap"

export interface CategoryCapInput {
  readonly categoryId: string
  readonly capMinor: number
}

export class CategoryCapsRepository extends Context.Tag("CategoryCapsRepository")<
  CategoryCapsRepository,
  {
    readonly listByCycle: (cycleId: string) => Effect.Effect<ReadonlyArray<CategoryCap>, SqlError>
    readonly replaceForCycle: (
      householdId: string,
      cycleId: string,
      caps: ReadonlyArray<CategoryCapInput>,
    ) => Effect.Effect<ReadonlyArray<CategoryCap>, SqlError>
  }
>() {}
