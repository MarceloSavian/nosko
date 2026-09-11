import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type { Bank } from "../../domain/models/Bank"

export class BanksRepository extends Context.Tag("BanksRepository")<
  BanksRepository,
  {
    readonly findByCode: (code: string) => Effect.Effect<Option.Option<Bank>, SqlError>
    readonly list: () => Effect.Effect<ReadonlyArray<Bank>, SqlError>
  }
>() {}
