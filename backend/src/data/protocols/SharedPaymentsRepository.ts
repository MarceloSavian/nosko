import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type {
  NewSharedPayment,
  SharedPayment,
  SharedPaymentUpdate,
} from "../../domain/models/SharedPayment"

export class SharedPaymentsRepository extends Context.Tag("SharedPaymentsRepository")<
  SharedPaymentsRepository,
  {
    readonly create: (input: NewSharedPayment) => Effect.Effect<SharedPayment, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<SharedPayment>, SqlError>
    readonly listByCycle: (cycleId: string) => Effect.Effect<ReadonlyArray<SharedPayment>, SqlError>
    readonly update: (
      id: string,
      input: SharedPaymentUpdate,
    ) => Effect.Effect<SharedPayment, SqlError>
    readonly remove: (id: string) => Effect.Effect<void, SqlError>
  }
>() {}
