import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type { Account, AccountVisibility, NewAccount } from "../../domain/models/Account"

export interface AccountUpdate {
  readonly nickname: string
  readonly maskedId: string | null
  readonly balanceMinor: number | null
  readonly purpose: string | null
  readonly statementCloseDay: number | null
  readonly creditLimitMinor: number | null
  readonly autopayAccountId: string | null
}

export class AccountsRepository extends Context.Tag("AccountsRepository")<
  AccountsRepository,
  {
    readonly create: (input: NewAccount) => Effect.Effect<Account, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<Account>, SqlError>
    readonly list: () => Effect.Effect<ReadonlyArray<Account>, SqlError>
    readonly update: (id: string, input: AccountUpdate) => Effect.Effect<Account, SqlError>
    readonly setVisibility: (
      id: string,
      visibility: AccountVisibility,
    ) => Effect.Effect<Account, SqlError>
    readonly setCoOwner: (id: string, coOwnerUserId: string) => Effect.Effect<Account, SqlError>
    readonly remove: (id: string) => Effect.Effect<void, SqlError>
  }
>() {}
