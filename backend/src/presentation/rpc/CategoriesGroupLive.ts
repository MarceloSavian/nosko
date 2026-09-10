import { CategoriesRpcs, CurrentUser } from "@nosko/contracts"
import { Effect } from "effect"
import { CategoriesRepository } from "../../data/protocols/CategoriesRepository"
import { NoHousehold } from "../../domain/errors/HouseholdErrors"
import type { Category } from "../../domain/models/Category"
import { dieOnSqlError } from "./dieOnSqlError"

const toCategoryView = (category: Category) => ({
  id: category.id,
  scope: category.scope,
  ownerUserId: category.ownerUserId,
  name: category.name,
  color: category.color,
  sortOrder: category.sortOrder,
})

export const CategoriesGroupLive = CategoriesRpcs.toLayer(
  Effect.gen(function* () {
    const categories = yield* CategoriesRepository

    return {
      "categories.list": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          if (currentUser.householdId === null) {
            return yield* Effect.fail(new NoHousehold({}))
          }
          const all = yield* categories.list().pipe(dieOnSqlError)
          return all.map(toCategoryView)
        }),
    }
  }),
)
