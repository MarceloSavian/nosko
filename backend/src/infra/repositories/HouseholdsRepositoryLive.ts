import { SqlClient } from "@effect/sql"
import { Effect, Layer, Option } from "effect"
import { HouseholdsRepository } from "../../data/protocols/HouseholdsRepository"
import { Household, HouseholdMember, HouseholdSettings } from "../../domain/models/Household"
import { decodeRow } from "./decode"

export const HouseholdsRepositoryLive = Layer.effect(
  HouseholdsRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const decodeHousehold = decodeRow(Household)
    const decodeMember = decodeRow(HouseholdMember)
    const decodeSettings = decodeRow(HouseholdSettings)

    return {
      create: (input) =>
        sql.withTransaction(
          Effect.gen(function* () {
            const rows = yield* sql`INSERT INTO ${sql("households")} ${sql.insert({
              name: input.name,
              baseCurrency: input.baseCurrency,
              createdBy: input.createdBy,
            })} RETURNING *`
            const household = yield* decodeHousehold(rows[0])

            yield* sql`select set_config('app.household_id', ${household.id}, true)`
            yield* sql`INSERT INTO ${sql("householdSettings")} ${sql.insert({
              householdId: household.id,
            })}`
            yield* sql`INSERT INTO ${sql("householdMembers")} ${sql.insert({
              householdId: household.id,
              userId: input.createdBy,
              role: "owner",
            })}`

            return household
          }),
        ),
      findById: (id) =>
        sql`SELECT * FROM ${sql("households")} WHERE id = ${id}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeHousehold(rows[0]).pipe(Effect.map(Option.some)),
          ),
        ),
      update: (id, input) =>
        sql`UPDATE ${sql("households")} SET ${sql.update({
          name: input.name,
          baseCurrency: input.baseCurrency,
          updatedAt: new Date(),
        })} WHERE id = ${id} RETURNING *`.pipe(Effect.flatMap((rows) => decodeHousehold(rows[0]))),
      addMember: (input) =>
        sql`INSERT INTO ${sql("householdMembers")} ${sql.insert({
          householdId: input.householdId,
          userId: input.userId,
          role: input.role,
          displayName: input.displayName,
        })} RETURNING *`.pipe(Effect.flatMap((rows) => decodeMember(rows[0]))),
      listMembers: (householdId) =>
        sql`SELECT * FROM ${sql("householdMembers")} WHERE ${sql("householdId")} = ${householdId}`.pipe(
          Effect.flatMap((rows) => Effect.forEach(rows, decodeMember)),
        ),
      removeMember: (householdId, userId) =>
        sql`DELETE FROM ${sql("householdMembers")} WHERE ${sql("householdId")} = ${householdId} AND ${sql("userId")} = ${userId}`.pipe(
          Effect.asVoid,
        ),
      findMembershipByUserId: (userId) =>
        sql`SELECT * FROM ${sql("householdMembers")} WHERE ${sql("userId")} = ${userId} LIMIT 1`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeMember(rows[0]).pipe(Effect.map(Option.some)),
          ),
        ),
      findSettings: (householdId) =>
        sql`SELECT * FROM ${sql("householdSettings")} WHERE ${sql("householdId")} = ${householdId}`.pipe(
          Effect.flatMap((rows) =>
            rows.length === 0
              ? Effect.succeed(Option.none())
              : decodeSettings(rows[0]).pipe(Effect.map(Option.some)),
          ),
        ),
    }
  }),
)
