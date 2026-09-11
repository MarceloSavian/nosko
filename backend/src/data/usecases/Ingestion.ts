import { DateTime, Effect, Option } from "effect"
import { AccountNotFound } from "../../domain/errors/AccountErrors"
import {
  CategoryRequired,
  TransactionAlreadyProcessed,
  TransactionNotFound,
  UnsupportedBankFormat,
} from "../../domain/errors/IngestionErrors"
import { parseCsv } from "../../domain/services/CsvParser"
import { computeDedupHash } from "../../domain/services/DedupHash"
import { matchTransfers } from "../../domain/services/TransferMatcher"
import { FileStorage } from "../../infra/storage/FileStorage"
import { AccountsRepository } from "../protocols/AccountsRepository"
import { BanksRepository } from "../protocols/BanksRepository"
import { StatementUploadsRepository } from "../protocols/StatementUploadsRepository"
import { TransactionsRepository } from "../protocols/TransactionsRepository"
import { ensureCycleForDate } from "./Cycles"
import { recordPayment } from "./SharedPayments"

export interface UploadStatementInput {
  readonly householdId: string
  readonly accountId: string
  readonly uploadedBy: string
  readonly originalFilename: string
  readonly fileContent: string
}

export interface UploadStatementResult {
  readonly uploadId: string
  readonly newCount: number
  readonly duplicateCount: number
  readonly transferPairCount: number
}

export const uploadStatement = (input: UploadStatementInput) =>
  Effect.gen(function* () {
    const accounts = yield* AccountsRepository
    const banks = yield* BanksRepository
    const uploads = yield* StatementUploadsRepository
    const transactions = yield* TransactionsRepository
    const fileStorage = yield* FileStorage

    const accountFound = yield* accounts.findById(input.accountId)
    if (Option.isNone(accountFound)) {
      return yield* Effect.fail(new AccountNotFound({}))
    }
    const account = accountFound.value

    const bankFound = yield* banks.findByCode(account.institution)
    if (Option.isNone(bankFound) || bankFound.value.csvConfig === null) {
      return yield* Effect.fail(new UnsupportedBankFormat({}))
    }
    const csvConfig = bankFound.value.csvConfig

    const fileKey = `${input.householdId}/${input.accountId}/${Date.now()}-${input.originalFilename}`
    // S3 failures are an infrastructure fault, not a domain-expected outcome — same treatment as
    // dieOnSqlError for SqlError.
    yield* fileStorage
      .put({ key: fileKey, body: input.fileContent, contentType: "text/csv" })
      .pipe(Effect.orDie)

    const upload = yield* uploads.create({
      householdId: input.householdId,
      accountId: input.accountId,
      uploadedBy: input.uploadedBy,
      fileKey,
      originalFilename: input.originalFilename,
      format: "csv",
    })

    const parsedRows = parseCsv(input.fileContent, csvConfig)
    const existingHashes = yield* transactions.existingDedupHashes(input.householdId)

    const seenInBatch = new Set<string>()
    let duplicateCount = 0
    const candidates: Array<{ row: (typeof parsedRows)[number]; dedupHash: string }> = []
    for (const row of parsedRows) {
      const dedupHash = computeDedupHash({
        accountId: input.accountId,
        externalId: row.externalId,
        bookedAt: row.bookedAt,
        description: row.description,
        amountMinor: row.amountMinor,
        direction: row.direction,
      })
      if (existingHashes.has(dedupHash) || seenInBatch.has(dedupHash)) {
        duplicateCount++
        continue
      }
      seenInBatch.add(dedupHash)
      candidates.push({ row, dedupHash })
    }

    const newTransactions = yield* Effect.forEach(candidates, ({ row, dedupHash }) =>
      Effect.gen(function* () {
        const suggestedCategoryId =
          row.counterparty !== null
            ? yield* transactions.lastCategoryForCounterparty(
                account.ownerUserId,
                account.visibility,
                row.counterparty,
              )
            : Option.none<string>()

        return {
          householdId: input.householdId,
          accountId: input.accountId,
          ownerUserId: account.ownerUserId,
          visibility: account.visibility,
          uploadId: upload.id,
          externalId: row.externalId,
          bookedAt: row.bookedAt,
          description: row.description,
          counterparty: row.counterparty,
          amountMinor: row.amountMinor,
          currency: row.currency,
          direction: row.direction,
          categoryId: Option.getOrNull(suggestedCategoryId),
          categoryConfidence: Option.isSome(suggestedCategoryId) ? 0.6 : null,
          isTransfer: false,
          linkedTransactionId: null,
          matchedRuleId: null,
          dedupHash,
        }
      }),
    )

    const inserted = yield* transactions.createMany(newTransactions)

    // Matched against every not-yet-linked staged transaction in the household, not just this
    // upload's own batch — a single upload only ever targets one account, so the other leg of a
    // transfer (e.g. Wise EUR out of the ING account, in on Revolut) necessarily comes from a
    // different upload, possibly one imported later.
    const unmatchedStaged = yield* transactions.listStaged(input.householdId)
    const pairs = matchTransfers(
      unmatchedStaged
        .filter((t) => !t.isTransfer)
        .map((t) => ({
          id: t.id,
          accountId: t.accountId,
          amountMinor: t.amountMinor,
          currency: t.currency,
          direction: t.direction,
          bookedAt: DateTime.toDate(t.bookedAt),
        })),
    )
    yield* Effect.forEach(
      pairs,
      (pair) =>
        Effect.all([
          transactions.linkTransfer(pair.debitId, pair.creditId),
          transactions.linkTransfer(pair.creditId, pair.debitId),
        ]),
      { discard: true },
    )

    const bookedTimes = parsedRows.map((r) => r.bookedAt.getTime())
    const periodStart = bookedTimes.length > 0 ? new Date(Math.min(...bookedTimes)) : null
    const periodEnd = bookedTimes.length > 0 ? new Date(Math.max(...bookedTimes)) : null
    yield* uploads.complete(upload.id, { periodStart, periodEnd, status: "parsed", error: null })

    return {
      uploadId: upload.id,
      newCount: inserted.length,
      duplicateCount,
      transferPairCount: pairs.length,
    }
  })

export interface ConfirmTransactionInput {
  readonly transactionId: string
  readonly householdId: string
  readonly baseCurrency: string
  readonly anchorDay: number
  readonly categoryId: string | null
  readonly currentUserId: string
}

// A shared debit becomes a real shared_payment feeding the cycle (reusing U7's recordPayment
// unchanged); a shared credit (a refund) and every personal transaction just get marked
// confirmed — shared_payments has no concept of incoming money, and personal spend has no
// separate ledger to feed. Either way the cycle covering the booked date is backfilled first, so
// importing a year of history creates a year of cycles as it's confirmed, not just today's.
export const confirmTransaction = (input: ConfirmTransactionInput) =>
  Effect.gen(function* () {
    const transactionsRepo = yield* TransactionsRepository

    const found = yield* transactionsRepo.findById(input.transactionId)
    if (Option.isNone(found)) {
      return yield* Effect.fail(new TransactionNotFound({}))
    }
    const transaction = found.value
    if (transaction.status !== "staged") {
      return yield* Effect.fail(new TransactionAlreadyProcessed({}))
    }

    const categoryId = input.categoryId ?? transaction.categoryId
    if (categoryId === null) {
      return yield* Effect.fail(new CategoryRequired({}))
    }

    const bookedAtDate = DateTime.toDate(transaction.bookedAt)
    yield* ensureCycleForDate({
      householdId: input.householdId,
      anchorDay: input.anchorDay,
      referenceDate: bookedAtDate,
    })

    let sharedPaymentId: string | null = null
    if (transaction.visibility === "shared" && transaction.direction === "debit") {
      const payment = yield* recordPayment({
        householdId: input.householdId,
        baseCurrency: input.baseCurrency,
        accountId: transaction.accountId,
        bookedAt: bookedAtDate,
        description: transaction.description,
        counterparty: transaction.counterparty,
        amountMinor: transaction.amountMinor,
        currency: transaction.currency,
        categoryId,
        createdBy: input.currentUserId,
      })
      sharedPaymentId = payment.id
    }

    return yield* transactionsRepo.confirm(input.transactionId, {
      categoryId,
      status: "confirmed",
      sharedPaymentId,
    })
  })

export interface BulkConfirmInput {
  readonly transactionIds: ReadonlyArray<string>
  readonly householdId: string
  readonly baseCurrency: string
  readonly anchorDay: number
  readonly categoryId: string | null
  readonly currentUserId: string
}

export const bulkConfirmTransactions = (input: BulkConfirmInput) =>
  Effect.forEach(input.transactionIds, (transactionId) =>
    confirmTransaction({
      transactionId,
      householdId: input.householdId,
      baseCurrency: input.baseCurrency,
      anchorDay: input.anchorDay,
      categoryId: input.categoryId,
      currentUserId: input.currentUserId,
    }),
  )

export const ignoreTransaction = (transactionId: string) =>
  Effect.gen(function* () {
    const transactionsRepo = yield* TransactionsRepository
    const found = yield* transactionsRepo.findById(transactionId)
    if (Option.isNone(found)) {
      return yield* Effect.fail(new TransactionNotFound({}))
    }
    if (found.value.status !== "staged") {
      return yield* Effect.fail(new TransactionAlreadyProcessed({}))
    }
    return yield* transactionsRepo.ignore(transactionId)
  })

export const recategorizeStagedTransaction = (transactionId: string, categoryId: string) =>
  Effect.gen(function* () {
    const transactionsRepo = yield* TransactionsRepository
    const found = yield* transactionsRepo.findById(transactionId)
    if (Option.isNone(found)) {
      return yield* Effect.fail(new TransactionNotFound({}))
    }
    if (found.value.status !== "staged") {
      return yield* Effect.fail(new TransactionAlreadyProcessed({}))
    }
    return yield* transactionsRepo.updateCategory(transactionId, categoryId)
  })
