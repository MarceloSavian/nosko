import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type {
  Cycle,
  CycleIncome,
  CycleUpdate,
  MemberTransfer,
  NewCycle,
  NewCycleIncome,
  NewMemberTransfer,
} from "../../domain/models/Cycle"

export class CyclesRepository extends Context.Tag("CyclesRepository")<
  CyclesRepository,
  {
    readonly create: (input: NewCycle) => Effect.Effect<Cycle, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<Cycle>, SqlError>
    readonly findByCycleKey: (
      householdId: string,
      cycleKey: string,
    ) => Effect.Effect<Option.Option<Cycle>, SqlError>
    readonly list: () => Effect.Effect<ReadonlyArray<Cycle>, SqlError>
    readonly findCurrent: (today: Date) => Effect.Effect<Option.Option<Cycle>, SqlError>
    readonly update: (id: string, input: CycleUpdate) => Effect.Effect<Cycle, SqlError>
    readonly close: (id: string) => Effect.Effect<Cycle, SqlError>
    readonly listIncomes: (cycleId: string) => Effect.Effect<ReadonlyArray<CycleIncome>, SqlError>
    readonly setIncome: (input: NewCycleIncome) => Effect.Effect<CycleIncome, SqlError>
    readonly listTransfers: (
      cycleId: string,
    ) => Effect.Effect<ReadonlyArray<MemberTransfer>, SqlError>
    readonly findTransferById: (
      id: string,
    ) => Effect.Effect<Option.Option<MemberTransfer>, SqlError>
    readonly recordTransfer: (input: NewMemberTransfer) => Effect.Effect<MemberTransfer, SqlError>
    readonly settleTransfer: (id: string) => Effect.Effect<MemberTransfer, SqlError>
  }
>() {}
