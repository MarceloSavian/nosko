import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect } from "effect"
import type { Account, AccountVisibility, NewAccount } from "../../domain/models/Account"

export class AccountsRepository extends Context.Tag("AccountsRepository")<
  AccountsRepository,
  {
    readonly create: (input: NewAccount) => Effect.Effect<Account, SqlError>
    readonly list: () => Effect.Effect<ReadonlyArray<Account>, SqlError>
    readonly setVisibility: (
      id: string,
      visibility: AccountVisibility,
    ) => Effect.Effect<Account, SqlError>
    readonly setCoOwner: (id: string, coOwnerUserId: string) => Effect.Effect<Account, SqlError>
  }
>() {}
