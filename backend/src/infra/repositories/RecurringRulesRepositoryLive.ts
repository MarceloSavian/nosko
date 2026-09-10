import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { RecurringRulesRepository } from "../../data/protocols/RecurringRulesRepository"
import { RecurringRule } from "../../domain/models/RecurringRule"
import { decodeRow } from "./decode"

export const RecurringRulesRepositoryLive = Layer.effect(
  RecurringRulesRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeRule = decodeRow(RecurringRule)
    const decodeFirst = (rows: ReadonlyArray<unknown>) => decodeRule(rows[0])

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("recurringRules")} ${sql.insert({
          householdId: input.householdId,
          matchType: input.matchType,
          matcher: input.matcher,
          expectedAmountMinor: input.expectedAmountMinor,
          currency: input.currency,
          categoryId: input.categoryId,
          cadence: input.cadence,
          isFixedBill: input.isFixedBill,
          source: "user_defined",
        })} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      findById: (id) =>
        sql`SELECT * FROM ${sql("recurringRules")} WHERE id = ${id}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeFirst(rows).pipe(Effect.map(Option.some)),
          ),
        ),
      list: () =>
        sql`SELECT * FROM ${sql("recurringRules")} ORDER BY ${sql("createdAt")} DESC`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeRule)),
        ),
      listActiveFixedBillRules: () =>
        sql`SELECT * FROM ${sql("recurringRules")} WHERE active = true AND ${sql("isFixedBill")} = true`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeRule)),
        ),
      update: (id, input) =>
        sql`UPDATE ${sql("recurringRules")} SET ${sql.update({
          matcher: input.matcher,
          expectedAmountMinor: input.expectedAmountMinor,
          currency: input.currency,
          categoryId: input.categoryId,
          cadence: input.cadence,
          isFixedBill: input.isFixedBill,
          updatedAt: new Date(),
        })} WHERE id = ${id} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      deactivate: (id) =>
        sql`UPDATE ${sql("recurringRules")} SET ${sql.update({ active: false, updatedAt: new Date() })} WHERE id = ${id} RETURNING *`.pipe(
          Effect.flatMap(decodeFirst),
        ),
    }
  }),
)
