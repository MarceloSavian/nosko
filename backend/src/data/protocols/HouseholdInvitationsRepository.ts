import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type {
  HouseholdInvitation,
  NewHouseholdInvitation,
} from "../../domain/models/HouseholdInvitation"

export class HouseholdInvitationsRepository extends Context.Tag("HouseholdInvitationsRepository")<
  HouseholdInvitationsRepository,
  {
    readonly create: (input: NewHouseholdInvitation) => Effect.Effect<HouseholdInvitation, SqlError>
    readonly findPendingByTokenHash: (
      householdId: string,
      tokenHash: string,
    ) => Effect.Effect<Option.Option<HouseholdInvitation>, SqlError>
    readonly listByHousehold: (
      householdId: string,
    ) => Effect.Effect<ReadonlyArray<HouseholdInvitation>, SqlError>
    readonly revoke: (id: string) => Effect.Effect<void, SqlError>
    readonly markAccepted: (id: string, acceptedBy: string) => Effect.Effect<void, SqlError>
  }
>() {}
