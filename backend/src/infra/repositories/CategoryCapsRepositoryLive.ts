import { SqlClient } from "@effect/sql"
import { Effect, Layer } from "effect"
import { CategoryCapsRepository } from "../../data/protocols/CategoryCapsRepository"
import { CategoryCap } from "../../domain/models/CategoryCap"
import { decodeRow } from "./decode"

export const CategoryCapsRepositoryLive = Layer.effect(
  CategoryCapsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeCap = decodeRow(CategoryCap)

    return {
      listByCycle: (cycleId) =>
        sql`SELECT * FROM ${sql("categoryCaps")} WHERE ${sql("cycleId")} = ${cycleId}`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeCap)),
        ),
      replaceForCycle: (householdId, cycleId, caps) =>
        sql.withTransaction(
          Effect.gen(function* () {
            yield* sql`DELETE FROM ${sql("categoryCaps")} WHERE ${sql("cycleId")} = ${cycleId}`
            if (caps.length === 0) {
              return []
            }
            const rows = yield* sql`INSERT INTO ${sql("categoryCaps")} ${sql.insert(
              caps.map((cap) => ({
                householdId,
                cycleId,
                categoryId: cap.categoryId,
                capMinor: cap.capMinor,
              })),
            )} RETURNING *`
            return yield* Effect.forEach(rows, decodeCap)
          }),
        ),
    }
  }),
)
