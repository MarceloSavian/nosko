import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { FixedBillsRepository } from "../../data/protocols/FixedBillsRepository"
import { FixedBill } from "../../domain/models/FixedBill"
import { decodeRow } from "./decode"

export const FixedBillsRepositoryLive = Layer.effect(
  FixedBillsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeBill = decodeRow(FixedBill)
    const decodeFirst = (rows: ReadonlyArray<unknown>) => decodeBill(rows[0])

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("fixedBills")} ${sql.insert({
          cycleId: input.cycleId,
          householdId: input.householdId,
          recurringRuleId: input.recurringRuleId,
          label: input.label,
          amountMinor: input.amountMinor,
          currency: input.currency,
          payingAccountId: input.payingAccountId,
          dueDay: input.dueDay,
          categoryId: input.categoryId,
          sortOrder: input.sortOrder,
        })} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      findById: (id) =>
        sql`SELECT * FROM ${sql("fixedBills")} WHERE id = ${id}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeFirst(rows).pipe(Effect.map(Option.some)),
          ),
        ),
      listByCycle: (cycleId) =>
        sql`SELECT * FROM ${sql("fixedBills")} WHERE ${sql("cycleId")} = ${cycleId} ORDER BY ${sql("sortOrder")} ASC`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeBill)),
        ),
      update: (id, input) =>
        sql`UPDATE ${sql("fixedBills")} SET ${sql.update({
          label: input.label,
          amountMinor: input.amountMinor,
          payingAccountId: input.payingAccountId,
          dueDay: input.dueDay,
          categoryId: input.categoryId,
          sortOrder: input.sortOrder,
          updatedAt: new Date(),
        })} WHERE id = ${id} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      setPaid: (id, paid, paidOnDay) =>
        sql`UPDATE ${sql("fixedBills")} SET ${sql.update({ paid, paidOnDay, updatedAt: new Date() })} WHERE id = ${id} RETURNING *`.pipe(
          Effect.flatMap(decodeFirst),
        ),
      remove: (id) => sql`DELETE FROM ${sql("fixedBills")} WHERE id = ${id}`.pipe(Effect.asVoid),
    }
  }),
)
