import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type {
  NewRecurringRule,
  RecurringRule,
  RecurringRuleUpdate,
} from "../../domain/models/RecurringRule"

export class RecurringRulesRepository extends Context.Tag("RecurringRulesRepository")<
  RecurringRulesRepository,
  {
    readonly create: (input: NewRecurringRule) => Effect.Effect<RecurringRule, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<RecurringRule>, SqlError>
    readonly list: () => Effect.Effect<ReadonlyArray<RecurringRule>, SqlError>
    readonly listActiveFixedBillRules: () => Effect.Effect<ReadonlyArray<RecurringRule>, SqlError>
    readonly update: (
      id: string,
      input: RecurringRuleUpdate,
    ) => Effect.Effect<RecurringRule, SqlError>
    readonly deactivate: (id: string) => Effect.Effect<RecurringRule, SqlError>
  }
>() {}
