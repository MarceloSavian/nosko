import { CurrentUser, IngestionRpcs } from "@nosko/contracts"
import { Effect, Option } from "effect"
import { BanksRepository } from "../../data/protocols/BanksRepository"
import { HouseholdsRepository } from "../../data/protocols/HouseholdsRepository"
import { TransactionsRepository } from "../../data/protocols/TransactionsRepository"
import {
  bulkConfirmTransactions,
  confirmTransaction,
  ignoreTransaction,
  recategorizeStagedTransaction,
  uploadStatement,
} from "../../data/usecases/Ingestion"
import { NoHousehold } from "../../domain/errors/HouseholdErrors"
import type { Bank } from "../../domain/models/Bank"
import type { Transaction } from "../../domain/models/Transaction"
import { dieOnSqlError } from "./dieOnSqlError"

const dieIfMissing = <A>(found: Option.Option<A>) =>
  Option.match(found, {
    onNone: () => Effect.die(new Error("expected row vanished mid-request")),
    onSome: Effect.succeed,
  })

const toBankView = (bank: Bank) => ({
  code: bank.code,
  name: bank.name,
  supportsCsv: bank.supportsCsv,
  supportsPdf: bank.supportsPdf,
})

const toTransactionView = (transaction: Transaction) => ({
  id: transaction.id,
  accountId: transaction.accountId,
  visibility: transaction.visibility,
  externalId: transaction.externalId,
  bookedAt: transaction.bookedAt,
  description: transaction.description,
  counterparty: transaction.counterparty,
  amountMinor: transaction.amountMinor,
  currency: transaction.currency,
  direction: transaction.direction,
  categoryId: transaction.categoryId,
  categoryConfidence: transaction.categoryConfidence,
  isTransfer: transaction.isTransfer,
  linkedTransactionId: transaction.linkedTransactionId,
  status: transaction.status,
})

export const IngestionGroupLive = IngestionRpcs.toLayer(
  Effect.gen(function* () {
    const banks = yield* BanksRepository
    const transactions = yield* TransactionsRepository
    const households = yield* HouseholdsRepository

    const requireHouseholdId = Effect.gen(function* () {
      const currentUser = yield* CurrentUser
      if (currentUser.householdId === null) {
        return yield* Effect.fail(new NoHousehold({}))
      }
      return currentUser.householdId
    })

    const settingsFor = (householdId: string) =>
      households.findSettings(householdId).pipe(dieOnSqlError, Effect.flatMap(dieIfMissing))

    return {
      "ingestion.listBanks": () =>
        Effect.gen(function* () {
          const all = yield* banks.list().pipe(dieOnSqlError)
          return all.filter((bank) => bank.active).map(toBankView)
        }),

      "ingestion.upload": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const householdId = yield* requireHouseholdId
          return yield* uploadStatement({
            householdId,
            accountId: payload.accountId,
            uploadedBy: currentUser.userId,
            originalFilename: payload.originalFilename,
            fileContent: payload.fileContent,
          }).pipe(dieOnSqlError)
        }),

      "ingestion.listStaged": () =>
        Effect.gen(function* () {
          const householdId = yield* requireHouseholdId
          const staged = yield* transactions.listStaged(householdId).pipe(dieOnSqlError)
          return staged.map(toTransactionView)
        }),

      "ingestion.confirm": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const householdId = yield* requireHouseholdId
          const settings = yield* settingsFor(householdId)
          const confirmed = yield* confirmTransaction({
            transactionId: payload.transactionId,
            householdId,
            baseCurrency: settings.baseCurrency,
            anchorDay: settings.cycleAnchorDay,
            categoryId: payload.categoryId,
            currentUserId: currentUser.userId,
          }).pipe(dieOnSqlError)
          return toTransactionView(confirmed)
        }),

      "ingestion.bulkConfirm": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const householdId = yield* requireHouseholdId
          const settings = yield* settingsFor(householdId)
          const confirmed = yield* bulkConfirmTransactions({
            transactionIds: payload.transactionIds,
            householdId,
            baseCurrency: settings.baseCurrency,
            anchorDay: settings.cycleAnchorDay,
            categoryId: payload.categoryId,
            currentUserId: currentUser.userId,
          }).pipe(dieOnSqlError)
          return confirmed.map(toTransactionView)
        }),

      "ingestion.ignore": (payload) =>
        Effect.gen(function* () {
          const ignored = yield* ignoreTransaction(payload.transactionId).pipe(dieOnSqlError)
          return toTransactionView(ignored)
        }),

      "ingestion.recategorize": (payload) =>
        Effect.gen(function* () {
          const updated = yield* recategorizeStagedTransaction(
            payload.transactionId,
            payload.categoryId,
          ).pipe(dieOnSqlError)
          return toTransactionView(updated)
        }),

      "ingestion.listMyPayments": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const confirmed = yield* transactions
            .listConfirmedPersonal(currentUser.userId)
            .pipe(dieOnSqlError)
          return confirmed.map(toTransactionView)
        }),
    }
  }),
)
