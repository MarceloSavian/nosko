import { SqlClient } from "@effect/sql"
import { Effect, Layer } from "effect"
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
      list: () =>
        sql`SELECT * FROM ${sql("accounts")} ORDER BY ${sql("createdAt")}`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeAccount)),
        ),
      setVisibility: (id, visibility) =>
        sql`UPDATE ${sql("accounts")} SET ${sql.update({ visibility, updatedAt: new Date() })} WHERE id = ${id} RETURNING *`.pipe(
          Effect.flatMap(decodeFirst),
        ),
      setCoOwner: (id, coOwnerUserId) =>
        sql`UPDATE ${sql("accounts")} SET ${sql.update({ coOwnerUserId, updatedAt: new Date() })} WHERE id = ${id} RETURNING *`.pipe(
          Effect.flatMap(decodeFirst),
        ),
    }
  }),
)
