import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { AccountsRepository } from "../../data/protocols/AccountsRepository"
import { Account } from "../../domain/models/Account"
import { decodeRow } from "./decode"

export const AccountsRepositoryLive = Layer.effect(
  AccountsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeAccount = decodeRow(Account)
    const decodeFirst = (rows: ReadonlyArray<unknown>) => decodeAccount(rows[0])

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("accounts")} ${sql.insert({
          householdId: input.householdId,
          ownerUserId: input.ownerUserId,
          ownership: input.ownership,
          visibility: input.visibility,
          institution: input.institution,
          nickname: input.nickname,
          type: input.type,
          currency: input.currency,
          maskedId: input.maskedId,
          balanceMinor: input.balanceMinor,
          purpose: input.purpose,
          statementCloseDay: input.statementCloseDay,
          creditLimitMinor: input.creditLimitMinor,
          autopayAccountId: input.autopayAccountId,
        })} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      findById: (id) =>
        sql`SELECT * FROM ${sql("accounts")} WHERE id = ${id}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeFirst(rows).pipe(Effect.map(Option.some)),
          ),
        ),
      list: () =>
        sql`SELECT * FROM ${sql("accounts")} ORDER BY ${sql("createdAt")}`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeAccount)),
        ),
      update: (id, input) =>
        sql`UPDATE ${sql("accounts")} SET ${sql.update({
          nickname: input.nickname,
          maskedId: input.maskedId,
          balanceMinor: input.balanceMinor,
          purpose: input.purpose,
          statementCloseDay: input.statementCloseDay,
          creditLimitMinor: input.creditLimitMinor,
          autopayAccountId: input.autopayAccountId,
          updatedAt: new Date(),
        })} WHERE id = ${id} RETURNING *`.pipe(Effect.flatMap(decodeFirst)),
      setVisibility: (id, visibility) =>
        sql`UPDATE ${sql("accounts")} SET ${sql.update({ visibility, updatedAt: new Date() })} WHERE id = ${id} RETURNING *`.pipe(
          Effect.flatMap(decodeFirst),
        ),
      setCoOwner: (id, coOwnerUserId) =>
        sql`UPDATE ${sql("accounts")} SET ${sql.update({ coOwnerUserId, updatedAt: new Date() })} WHERE id = ${id} RETURNING *`.pipe(
          Effect.flatMap(decodeFirst),
        ),
      remove: (id) => sql`DELETE FROM ${sql("accounts")} WHERE id = ${id}`.pipe(Effect.asVoid),
    }
  }),
)
