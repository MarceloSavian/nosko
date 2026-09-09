import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect } from "effect"
import type {
  Category,
  NewHouseholdCategory,
  NewPersonalCategory,
} from "../../domain/models/Category"

export class CategoriesRepository extends Context.Tag("CategoriesRepository")<
  CategoriesRepository,
  {
    readonly createHousehold: (input: NewHouseholdCategory) => Effect.Effect<Category, SqlError>
    readonly createPersonal: (input: NewPersonalCategory) => Effect.Effect<Category, SqlError>
    readonly list: () => Effect.Effect<ReadonlyArray<Category>, SqlError>
  }
>() {}
