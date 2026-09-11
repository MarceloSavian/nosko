import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { TransactionsRepository } from "../../data/protocols/TransactionsRepository"
import { Transaction } from "../../domain/models/Transaction"
import { decodeRow } from "./decode"

export const TransactionsRepositoryLive = Layer.effect(
  TransactionsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeTransaction = decodeRow(Transaction)
    const decodeFirst = (rows: ReadonlyArray<unknown>) => decodeTransaction(rows[0])

    return {
      createMany: (inputs) =>
        Effect.forEach(inputs, (input) =>
          sql`INSERT INTO ${sql("transactions")} ${sql.insert({
            householdId: input.householdId,
            accountId: input.accountId,
            ownerUserId: input.ownerUserId,
            visibility: input.visibility,
            uploadId: input.uploadId,
            externalId: input.externalId,
            bookedAt: input.bookedAt,
            description: input.description,
            counterparty: input.counterparty,
            amountMinor: input.amountMinor,
            currency: input.currency,
            direction: input.direction,
            categoryId: input.categoryId,
            categoryConfidence: input.categoryConfidence,
            isTransfer: input.isTransfer,
            linkedTransactionId: input.linkedTransactionId,
            matchedRuleId: input.matchedRuleId,
            dedupHash: input.dedupHash,
          })} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
        ),
      findById: (id) =>
        sql`SELECT * FROM ${sql("transactions")} WHERE id = ${id}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeFirst(rows).pipe(Effect.map(Option.some)),
          ),
        ),
      existingDedupHashes: (householdId) =>
        sql`SELECT ${sql("dedupHash")} FROM ${sql("transactions")} WHERE ${sql("householdId")} = ${householdId}`.pipe(
          Effect.map(
            (rows) => new Set(rows.map((row) => (row as { dedupHash: string }).dedupHash)),
          ),
        ),
      listStaged: (householdId) =>
        sql`SELECT * FROM ${sql("transactions")} WHERE ${sql("householdId")} = ${householdId} AND ${sql("status")} = 'staged' ORDER BY ${sql("bookedAt")} DESC`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeTransaction)),
        ),
      listConfirmedPersonal: (ownerUserId) =>
        sql`
          SELECT * FROM ${sql("transactions")}
          WHERE ${sql("ownerUserId")} = ${ownerUserId}
            AND ${sql("visibility")} = 'personal'
            AND ${sql("status")} = 'confirmed'
          ORDER BY ${sql("bookedAt")} DESC
        `.pipe(Effect.flatMap((rows) => Effect.forEach(rows, decodeTransaction))),
      listByUpload: (uploadId) =>
        sql`SELECT * FROM ${sql("transactions")} WHERE ${sql("uploadId")} = ${uploadId} ORDER BY ${sql("bookedAt")} DESC`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeTransaction)),
        ),
      updateCategory: (id, categoryId) =>
        sql`UPDATE ${sql("transactions")} SET ${sql.update({ categoryId })} WHERE id = ${id} RETURNING *`.pipe(
          Effect.flatMap(decodeFirst),
        ),
      confirm: (id, update) =>
        sql`UPDATE ${sql("transactions")} SET ${sql.update({
          categoryId: update.categoryId,
          status: update.status,
          sharedPaymentId: update.sharedPaymentId,
        })} WHERE id = ${id} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      ignore: (id) =>
        sql`UPDATE ${sql("transactions")} SET ${sql.update({ status: "ignored" })} WHERE id = ${id} RETURNING *`.pipe(
          Effect.flatMap(decodeFirst),
        ),
      linkTransfer: (id, linkedTransactionId) =>
        sql`UPDATE ${sql("transactions")} SET ${sql.update({ isTransfer: true, linkedTransactionId })} WHERE id = ${id}`.pipe(
          Effect.asVoid,
        ),
      lastCategoryForCounterparty: (ownerUserId, visibility, counterparty) =>
        sql`
          SELECT ${sql("categoryId")} FROM ${sql("transactions")}
          WHERE ${sql("ownerUserId")} = ${ownerUserId}
            AND ${sql("visibility")} = ${visibility}
            AND ${sql("counterparty")} = ${counterparty}
            AND ${sql("categoryId")} IS NOT NULL
            AND ${sql("status")} = 'confirmed'
          ORDER BY ${sql("bookedAt")} DESC
          LIMIT 1
        `.pipe(
          Effect.map((rows) =>
            Option.fromNullable((rows[0] as { categoryId: string } | undefined)?.categoryId),
          ),
        ),
    }
  }),
)
