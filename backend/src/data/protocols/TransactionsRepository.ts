import type { SqlError } from "@effect/sql/SqlError"
import { Context, type Effect, type Option } from "effect"
import type {
  NewTransaction,
  Transaction,
  TransactionConfirmUpdate,
} from "../../domain/models/Transaction"

export class TransactionsRepository extends Context.Tag("TransactionsRepository")<
  TransactionsRepository,
  {
    readonly createMany: (
      inputs: ReadonlyArray<NewTransaction>,
    ) => Effect.Effect<ReadonlyArray<Transaction>, SqlError>
    readonly findById: (id: string) => Effect.Effect<Option.Option<Transaction>, SqlError>
    readonly existingDedupHashes: (
      householdId: string,
    ) => Effect.Effect<ReadonlySet<string>, SqlError>
    readonly listStaged: (
      householdId: string,
    ) => Effect.Effect<ReadonlyArray<Transaction>, SqlError>
    readonly listConfirmedPersonal: (
      ownerUserId: string,
    ) => Effect.Effect<ReadonlyArray<Transaction>, SqlError>
    readonly listByUpload: (uploadId: string) => Effect.Effect<ReadonlyArray<Transaction>, SqlError>
    readonly updateCategory: (
      id: string,
      categoryId: string,
    ) => Effect.Effect<Transaction, SqlError>
    readonly confirm: (
      id: string,
      update: TransactionConfirmUpdate,
    ) => Effect.Effect<Transaction, SqlError>
    readonly ignore: (id: string) => Effect.Effect<Transaction, SqlError>
    readonly linkTransfer: (
      id: string,
      linkedTransactionId: string,
    ) => Effect.Effect<void, SqlError>
    readonly lastCategoryForCounterparty: (
      ownerUserId: string,
      visibility: "personal" | "shared",
      counterparty: string,
    ) => Effect.Effect<Option.Option<string>, SqlError>
  }
>() {}
