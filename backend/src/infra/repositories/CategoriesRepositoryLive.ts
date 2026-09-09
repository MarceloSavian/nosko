import { SqlClient } from "@effect/sql"
import { Effect, Layer } from "effect"
import { CategoriesRepository } from "../../data/protocols/CategoriesRepository"
import { Category } from "../../domain/models/Category"
import { decodeRow } from "./decode"

export const CategoriesRepositoryLive = Layer.effect(
  CategoriesRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeCategory = decodeRow(Category)
    const decodeFirst = (rows: ReadonlyArray<unknown>) => decodeCategory(rows[0])

    return {
      createHousehold: (input) =>
        sql`INSERT INTO ${sql("categories")} ${sql.insert({
          householdId: input.householdId,
          scope: "household",
          name: input.name,
          color: input.color,
          sortOrder: input.sortOrder,
        })} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      createPersonal: (input) =>
        sql`INSERT INTO ${sql("categories")} ${sql.insert({
          householdId: input.householdId,
          scope: "personal",
          ownerUserId: input.ownerUserId,
          name: input.name,
          color: input.color,
          sortOrder: input.sortOrder,
        })} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      list: () =>
        sql`SELECT * FROM ${sql("categories")} ORDER BY ${sql("sortOrder")}`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeCategory)),
        ),
    }
  }),
)
