import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type {
  Household,
  HouseholdMember,
  HouseholdMemberRole,
  NewHousehold,
} from "../../domain/models/Household"

export class HouseholdsRepository extends Context.Tag("HouseholdsRepository")<
  HouseholdsRepository,
  {
    readonly create: (input: NewHousehold) => Effect.Effect<Household, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<Household>, SqlError>
    readonly update: (
      id: string,
      input: { readonly name: string; readonly baseCurrency: string },
    ) => Effect.Effect<Household, SqlError>
    readonly addMember: (input: {
      readonly householdId: string
      readonly userId: string
      readonly role: HouseholdMemberRole
      readonly displayName: string | null
    }) => Effect.Effect<HouseholdMember, SqlError>
    readonly listMembers: (
      householdId: string,
    ) => Effect.Effect<ReadonlyArray<HouseholdMember>, SqlError>
    readonly removeMember: (householdId: string, userId: string) => Effect.Effect<void, SqlError>
    readonly findMembershipByUserId: (
      userId: string,
    ) => Effect.Effect<Option.Option<HouseholdMember>, SqlError>
  }
>() {}
