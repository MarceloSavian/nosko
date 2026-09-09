import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { HouseholdInvitationsRepository } from "../../data/protocols/HouseholdInvitationsRepository"
import { HouseholdInvitation } from "../../domain/models/HouseholdInvitation"
import { decodeRow } from "./decode"

export const HouseholdInvitationsRepositoryLive = Layer.effect(
  HouseholdInvitationsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeInvitation = decodeRow(HouseholdInvitation)

    return {
      create: (input) =>
        sql`INSERT INTO ${sql("householdInvitations")} ${sql.insert({
          householdId: input.householdId,
          email: input.email,
          tokenHash: input.tokenHash,
          invitedBy: input.invitedBy,
          expiresAt: input.expiresAt,
        })} RETURNING *`.pipe(Effect.flatMap((rows) => decodeInvitation(rows[0]))),
      findPendingByTokenHash: (householdId, tokenHash) =>
        sql`SELECT * FROM ${sql("householdInvitations")}
            WHERE ${sql("householdId")} = ${householdId}
              AND ${sql("tokenHash")} = ${tokenHash}
              AND status = 'pending'
              AND ${sql("expiresAt")} > now()`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeInvitation(rows[0]).pipe(Effect.map(Option.some)),
          ),
        ),
      listByHousehold: (householdId) =>
        sql`SELECT * FROM ${sql("householdInvitations")} WHERE ${sql("householdId")} = ${householdId} ORDER BY ${sql("createdAt")} DESC`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeInvitation)),
        ),
      revoke: (id) =>
        sql`UPDATE ${sql("householdInvitations")} SET ${sql.update({
          status: "revoked",
        })} WHERE id = ${id}`.pipe(Effect.asVoid),
      markAccepted: (id, acceptedBy) =>
        sql`UPDATE ${sql("householdInvitations")} SET ${sql.update({
          status: "accepted",
          acceptedBy,
        })} WHERE id = ${id}`.pipe(Effect.asVoid),
    }
  }),
)
