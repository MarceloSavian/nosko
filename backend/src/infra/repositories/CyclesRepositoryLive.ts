import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { CyclesRepository } from "../../data/protocols/CyclesRepository"
import { Cycle, CycleIncome, MemberTransfer } from "../../domain/models/Cycle"
import { decodeRow } from "./decode"

export const CyclesRepositoryLive = Layer.effect(
  CyclesRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeCycle = decodeRow(Cycle)
    const decodeIncome = decodeRow(CycleIncome)
    const decodeTransfer = decodeRow(MemberTransfer)
    const decodeFirst =
      <A>(decode: (row: unknown) => Effect.Effect<A, never>) =>
      (rows: ReadonlyArray<unknown>) =>
        decode(rows[0])
    const decodeMaybeFirst =
      <A>(decode: (row: unknown) => Effect.Effect<A, never>) =>
      (rows: ReadonlyArray<unknown>) =>
        rows.length === 0
          ? Effect.succeed(Option.none())
          : decode(rows[0]).pipe(Effect.map(Option.some))

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("cycles")} ${sql.insert({
          householdId: input.householdId,
          cycleKey: input.cycleKey,
          title: input.title,
          startDate: input.startDate,
          endDate: input.endDate,
          reserveMinor: input.reserveMinor,
          estimateMinor: input.estimateMinor,
          seedOpeningBalanceMinor: input.seedOpeningBalanceMinor,
        })} RETURNING *`.pipe(Effect.flatMap(decodeFirst(decodeCycle))),
      findById: (id) =>
        sql`SELECT * FROM ${sql("cycles")} WHERE id = ${id}`.pipe(
          Effect.flatMap(decodeMaybeFirst(decodeCycle)),
        ),
      findByCycleKey: (householdId, cycleKey) =>
        sql`SELECT * FROM ${sql("cycles")} WHERE ${sql("householdId")} = ${householdId} AND ${sql("cycleKey")} = ${cycleKey}`.pipe(
          Effect.flatMap(decodeMaybeFirst(decodeCycle)),
        ),
      list: () =>
        sql`SELECT * FROM ${sql("cycles")} ORDER BY ${sql("startDate")} ASC`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeCycle)),
        ),
      findCurrent: (today) =>
        sql`SELECT * FROM ${sql("cycles")} WHERE ${sql("startDate")} <= ${today} AND ${sql("endDate")} >= ${today} LIMIT 1`.pipe(
          Effect.flatMap(decodeMaybeFirst(decodeCycle)),
        ),
      update: (id, input) =>
        sql`UPDATE ${sql("cycles")} SET ${sql.update({
          title: input.title,
          reserveMinor: input.reserveMinor,
          estimateMinor: input.estimateMinor,
          surplusGoalId: input.surplusGoalId,
          surplusDestinationLabel: input.surplusDestinationLabel,
          updatedAt: new Date(),
        })} WHERE id = ${id} RETURNING *`.pipe(Effect.flatMap(decodeFirst(decodeCycle))),
      close: (id) =>
        sql`UPDATE ${sql("cycles")} SET ${sql.update({
          status: "closed",
          closedAt: new Date(),
          updatedAt: new Date(),
        })} WHERE id = ${id} RETURNING *`.pipe(Effect.flatMap(decodeFirst(decodeCycle))),
      listIncomes: (cycleId) =>
        sql`SELECT * FROM ${sql("cycleIncomes")} WHERE ${sql("cycleId")} = ${cycleId}`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeIncome)),
        ),
      setIncome: (input) =>
        sql`
          INSERT INTO ${sql("cycleIncomes")} (cycle_id, household_id, member_user_id, kind, amount_minor, currency)
          VALUES (${input.cycleId}, ${input.householdId}, ${input.memberUserId}, ${input.kind}, ${input.amountMinor}, ${input.currency})
          ON CONFLICT (cycle_id, member_user_id, kind) DO UPDATE
            SET amount_minor = excluded.amount_minor, currency = excluded.currency, updated_at = now()
          RETURNING *
        `.pipe(Effect.flatMap(decodeFirst(decodeIncome))),
      listTransfers: (cycleId) =>
        sql`SELECT * FROM ${sql("memberTransfers")} WHERE ${sql("cycleId")} = ${cycleId}`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeTransfer)),
        ),
      findTransferById: (id) =>
        sql`SELECT * FROM ${sql("memberTransfers")} WHERE id = ${id}`.pipe(
          Effect.flatMap(decodeMaybeFirst(decodeTransfer)),
        ),
      recordTransfer: (input) =>
        sql`INSERT INTO ${sql("memberTransfers")} ${sql.insert({
          cycleId: input.cycleId,
          householdId: input.householdId,
          memberUserId: input.memberUserId,
          direction: input.direction,
          amountMinor: input.amountMinor,
          currency: input.currency,
          method: input.method,
        })} RETURNING *`.pipe(Effect.flatMap(decodeFirst(decodeTransfer))),
      settleTransfer: (id) =>
        sql`UPDATE ${sql("memberTransfers")} SET ${sql.update({ settledAt: new Date() })} WHERE id = ${id} RETURNING *`.pipe(
          Effect.flatMap(decodeFirst(decodeTransfer)),
        ),
    }
  }),
)
