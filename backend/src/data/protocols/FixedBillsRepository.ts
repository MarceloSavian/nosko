import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type { FixedBill, FixedBillUpdate, NewFixedBill } from "../../domain/models/FixedBill"

export class FixedBillsRepository extends Context.Tag("FixedBillsRepository")<
  FixedBillsRepository,
  {
    readonly create: (input: NewFixedBill) => Effect.Effect<FixedBill, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<FixedBill>, SqlError>
    readonly listByCycle: (cycleId: string) => Effect.Effect<ReadonlyArray<FixedBill>, SqlError>
    readonly update: (id: string, input: FixedBillUpdate) => Effect.Effect<FixedBill, SqlError>
    readonly setPaid: (
      id: string,
      paid: boolean,
      paidOnDay: number | null,
    ) => Effect.Effect<FixedBill, SqlError>
    readonly remove: (id: string) => Effect.Effect<void, SqlError>
  }
>() {}
