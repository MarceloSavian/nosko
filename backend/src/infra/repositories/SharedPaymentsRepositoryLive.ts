import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { SharedPaymentsRepository } from "../../data/protocols/SharedPaymentsRepository"
import { SharedPayment } from "../../domain/models/SharedPayment"
import { decodeRow } from "./decode"

export const SharedPaymentsRepositoryLive = Layer.effect(
  SharedPaymentsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodePayment = decodeRow(SharedPayment)
    const decodeFirst = (rows: ReadonlyArray<unknown>) => decodePayment(rows[0])

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("sharedPayments")} ${sql.insert({
          householdId: input.householdId,
          cycleId: input.cycleId,
          accountId: input.accountId,
          bookedAt: input.bookedAt,
          description: input.description,
          counterparty: input.counterparty,
          amountMinor: input.amountMinor,
          currency: input.currency,
          amountBaseMinor: input.amountBaseMinor,
          fxRate: input.fxRate,
          categoryId: input.categoryId,
          createdBy: input.createdBy,
        })} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      findById: (id) =>
        sql`SELECT * FROM ${sql("sharedPayments")} WHERE id = ${id}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeFirst(rows).pipe(Effect.map(Option.some)),
          ),
        ),
      listByCycle: (cycleId) =>
        sql`SELECT * FROM ${sql("sharedPayments")} WHERE ${sql("cycleId")} = ${cycleId} ORDER BY ${sql("bookedAt")} ASC`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodePayment)),
        ),
      update: (id, input) =>
        sql`UPDATE ${sql("sharedPayments")} SET ${sql.update({
          description: input.description,
          counterparty: input.counterparty,
          amountMinor: input.amountMinor,
          amountBaseMinor: input.amountBaseMinor,
          fxRate: input.fxRate,
          categoryId: input.categoryId,
          updatedAt: new Date(),
        })} WHERE id = ${id} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      remove: (id) =>
        sql`DELETE FROM ${sql("sharedPayments")} WHERE id = ${id}`.pipe(Effect.asVoid),
    }
  }),
)
