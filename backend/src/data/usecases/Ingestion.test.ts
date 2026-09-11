import { describe, expect, it } from "@jest/globals"
import { DateTime, Effect, Exit, Layer } from "effect"
import type { Account } from "../../domain/models/Account"
import type { Bank } from "../../domain/models/Bank"
import type { Transaction } from "../../domain/models/Transaction"
import { makeFakeFileStorage } from "../../test/fakeFileStorage"
import {
  makeFakeAccountsRepository,
  makeFakeBanksRepository,
  makeFakeCyclesRepository,
  makeFakeFxRatesRepository,
  makeFakeSharedPaymentsRepository,
  makeFakeStatementUploadsRepository,
  makeFakeTransactionsRepository,
} from "../../test/fakeRepositories"
import {
  bulkConfirmTransactions,
  confirmTransaction,
  ignoreTransaction,
  recategorizeStagedTransaction,
  uploadStatement,
} from "./Ingestion"

const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const ownerUserId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"

const nubankBank: Bank = {
  code: "nubank",
  name: "Nubank",
  supportsCsv: true,
  supportsPdf: false,
  active: true,
  csvConfig: {
    delimiter: ",",
    dateColumn: "Data",
    dateFormat: "DD/MM/YYYY",
    descriptionColumn: "Descrição",
    counterpartyColumn: null,
    amountColumn: "Valor",
    decimalSeparator: ".",
    signConvention: "signed",
    directionColumn: null,
    creditDirectionValue: null,
    externalIdColumn: "Identificador",
    currencyColumn: null,
    defaultCurrency: "BRL",
    filterColumn: null,
    filterValue: null,
  },
}

const ingBank: Bank = {
  code: "ing",
  name: "ING",
  supportsCsv: true,
  supportsPdf: false,
  active: true,
  csvConfig: {
    delimiter: ";",
    dateColumn: "Date",
    dateFormat: "YYYYMMDD",
    descriptionColumn: "Name / Description",
    counterpartyColumn: "Counterparty",
    amountColumn: "Amount (EUR)",
    decimalSeparator: ",",
    signConvention: "direction_column",
    directionColumn: "Debit/credit",
    creditDirectionValue: "Credit",
    externalIdColumn: null,
    currencyColumn: null,
    defaultCurrency: "EUR",
    filterColumn: null,
    filterValue: null,
  },
}

const otherBank: Bank = {
  code: "other",
  name: "Other",
  supportsCsv: false,
  supportsPdf: false,
  active: true,
  csvConfig: null,
}

const personalAccount: Account = {
  id: "11111111-1111-1111-1111-111111111111",
  householdId,
  ownerUserId,
  coOwnerUserId: null,
  ownership: "sole",
  visibility: "personal",
  institution: "nubank",
  nickname: "Nubank",
  type: "checking",
  currency: "BRL",
  maskedId: null,
  balanceMinor: null,
  purpose: null,
  statementCloseDay: null,
  creditLimitMinor: null,
  autopayAccountId: null,
  source: "manual",
  lastImportAt: null,
  createdAt: DateTime.unsafeFromDate(new Date()),
  updatedAt: DateTime.unsafeFromDate(new Date()),
}

const sharedAccount: Account = {
  ...personalAccount,
  id: "22222222-2222-2222-2222-222222222222",
  visibility: "shared",
  ownership: "joint",
  institution: "ing",
  currency: "EUR",
}

const manualAccount: Account = {
  ...personalAccount,
  id: "33333333-3333-3333-3333-333333333333",
  institution: "other",
}

const buildLayer = () => {
  const accountsFake = makeFakeAccountsRepository([personalAccount, sharedAccount, manualAccount])
  const banksFake = makeFakeBanksRepository([nubankBank, ingBank, otherBank])
  const uploadsFake = makeFakeStatementUploadsRepository()
  const transactionsFake = makeFakeTransactionsRepository()
  const fileStorageFake = makeFakeFileStorage()
  const cyclesFake = makeFakeCyclesRepository()
  const paymentsFake = makeFakeSharedPaymentsRepository()
  const fxRatesFake = makeFakeFxRatesRepository()

  const layer = Layer.mergeAll(
    accountsFake.layer,
    banksFake.layer,
    uploadsFake.layer,
    transactionsFake.layer,
    fileStorageFake.layer,
    cyclesFake.layer,
    paymentsFake.layer,
    fxRatesFake.layer,
  )

  return { layer, uploadsFake, transactionsFake, fileStorageFake, cyclesFake, paymentsFake }
}

describe("uploadStatement", () => {
  it("parses a Nubank CSV, dedupes on re-upload, and stores the file", async () => {
    const { layer, transactionsFake, fileStorageFake } = buildLayer()
    const csv = [
      "Data,Valor,Identificador,Descrição",
      "05/01/2026,120.50,ext-1,Mercado",
      "06/01/2026,-45.90,ext-2,Farmácia",
    ].join("\n")

    const first = await Effect.runPromise(
      uploadStatement({
        householdId,
        accountId: personalAccount.id,
        uploadedBy: ownerUserId,
        originalFilename: "extrato.csv",
        fileContent: csv,
      }).pipe(Effect.provide(layer)),
    )

    expect(first.newCount).toBe(2)
    expect(first.duplicateCount).toBe(0)
    expect(transactionsFake.transactions.size).toBe(2)
    expect(fileStorageFake.puts).toHaveLength(1)

    const second = await Effect.runPromise(
      uploadStatement({
        householdId,
        accountId: personalAccount.id,
        uploadedBy: ownerUserId,
        originalFilename: "extrato.csv",
        fileContent: csv,
      }).pipe(Effect.provide(layer)),
    )

    expect(second.newCount).toBe(0)
    expect(second.duplicateCount).toBe(2)
  })

  it("suggests the last category used for the same counterparty (ING has one)", async () => {
    const { layer, transactionsFake } = buildLayer()
    const categoryId = "44444444-4444-4444-4444-444444444444"
    transactionsFake.transactions.set("existing", {
      id: "existing",
      householdId,
      accountId: sharedAccount.id,
      ownerUserId,
      visibility: "shared",
      uploadId: null,
      externalId: null,
      bookedAt: DateTime.unsafeFromDate(new Date("2025-12-01")),
      description: "Vodafone",
      counterparty: "NL02BANK0000000002",
      amountMinor: 3000,
      currency: "EUR",
      direction: "debit",
      categoryId,
      categoryConfidence: null,
      isTransfer: false,
      linkedTransactionId: null,
      matchedRuleId: null,
      status: "confirmed",
      sharedPaymentId: null,
      dedupHash: "existing-hash",
      createdAt: DateTime.unsafeFromDate(new Date()),
    } satisfies Transaction)

    const csv = [
      '"Date";"Name / Description";"Account";"Counterparty";"Code";"Debit/credit";"Amount (EUR)";"Transaction type";"Notifications";"Resulting balance";"Tag"',
      '"20260105";"Vodafone";"NL01BANK0000000001";"NL02BANK0000000002";"IC";"Debit";"30,00";"SEPA direct debit";"";"100,00";""',
    ].join("\n")

    await Effect.runPromise(
      uploadStatement({
        householdId,
        accountId: sharedAccount.id,
        uploadedBy: ownerUserId,
        originalFilename: "ing.csv",
        fileContent: csv,
      }).pipe(Effect.provide(layer)),
    )

    const inserted = [...transactionsFake.transactions.values()].find(
      (t) => t.description === "Vodafone" && t.id !== "existing",
    )
    expect(inserted?.categoryId).toBe(categoryId)
    expect(inserted?.categoryConfidence).toBe(0.6)
  })

  it("handles a header-only file with no rows (null period, zero counts)", async () => {
    const { layer, uploadsFake } = buildLayer()

    const result = await Effect.runPromise(
      uploadStatement({
        householdId,
        accountId: personalAccount.id,
        uploadedBy: ownerUserId,
        originalFilename: "empty.csv",
        fileContent: "Data,Valor,Identificador,Descrição",
      }).pipe(Effect.provide(layer)),
    )

    expect(result.newCount).toBe(0)
    expect(result.duplicateCount).toBe(0)
    const upload = uploadsFake.uploads.get(result.uploadId)
    expect(upload?.periodStart).toBeNull()
    expect(upload?.periodEnd).toBeNull()
  })

  it("fails with UnsupportedBankFormat for a bank with no CSV config", async () => {
    const { layer } = buildLayer()
    const exit = await Effect.runPromiseExit(
      uploadStatement({
        householdId,
        accountId: manualAccount.id,
        uploadedBy: ownerUserId,
        originalFilename: "x.csv",
        fileContent: "a,b\n1,2",
      }).pipe(Effect.provide(layer)),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("fails with AccountNotFound for an unknown account", async () => {
    const { layer } = buildLayer()
    const exit = await Effect.runPromiseExit(
      uploadStatement({
        householdId,
        accountId: "00000000-0000-0000-0000-000000000000",
        uploadedBy: ownerUserId,
        originalFilename: "x.csv",
        fileContent: "a,b\n1,2",
      }).pipe(Effect.provide(layer)),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("pairs a transfer between two staged legs in different accounts", async () => {
    const { layer, transactionsFake } = buildLayer()
    // The credit leg, already staged from an earlier upload of the shared (ING) account.
    transactionsFake.transactions.set("credit-leg", {
      id: "credit-leg",
      householdId,
      accountId: sharedAccount.id,
      ownerUserId,
      visibility: "shared",
      uploadId: null,
      externalId: null,
      bookedAt: DateTime.unsafeFromDate(new Date("2026-01-05")),
      description: "From savings",
      counterparty: null,
      amountMinor: 12050,
      currency: "BRL",
      direction: "credit",
      categoryId: null,
      categoryConfidence: null,
      isTransfer: false,
      linkedTransactionId: null,
      matchedRuleId: null,
      status: "staged",
      sharedPaymentId: null,
      dedupHash: "credit-leg-hash",
      createdAt: DateTime.unsafeFromDate(new Date()),
    } satisfies Transaction)

    const csv = ["Data,Valor,Identificador,Descrição", "05/01/2026,-120.50,ext-3,To savings"].join(
      "\n",
    )

    await Effect.runPromise(
      uploadStatement({
        householdId,
        accountId: personalAccount.id,
        uploadedBy: ownerUserId,
        originalFilename: "extrato.csv",
        fileContent: csv,
      }).pipe(Effect.provide(layer)),
    )

    const debitLeg = [...transactionsFake.transactions.values()].find(
      (t) => t.description === "To savings",
    )
    const creditLeg = transactionsFake.transactions.get("credit-leg")
    expect(debitLeg?.isTransfer).toBe(true)
    expect(debitLeg?.linkedTransactionId).toBe("credit-leg")
    expect(creditLeg?.isTransfer).toBe(true)
    expect(creditLeg?.linkedTransactionId).toBe(debitLeg?.id)
  })
})

describe("confirmTransaction", () => {
  const stageTransaction = (
    transactionsFake: ReturnType<typeof makeFakeTransactionsRepository>,
    overrides: Partial<Transaction>,
  ) => {
    const id = overrides.id ?? "staged-1"
    const record: Transaction = {
      id,
      householdId,
      accountId: personalAccount.id,
      ownerUserId,
      visibility: "personal",
      uploadId: null,
      externalId: null,
      bookedAt: DateTime.unsafeFromDate(new Date("2026-01-05")),
      description: "Mercado",
      counterparty: null,
      amountMinor: 5000,
      currency: "BRL",
      direction: "debit",
      categoryId: null,
      categoryConfidence: null,
      isTransfer: false,
      linkedTransactionId: null,
      matchedRuleId: null,
      status: "staged",
      sharedPaymentId: null,
      dedupHash: `hash-${id}`,
      createdAt: DateTime.unsafeFromDate(new Date()),
      ...overrides,
    }
    transactionsFake.transactions.set(id, record)
    return record
  }

  const categoryId = "55555555-5555-5555-5555-555555555555"

  it("confirms a personal transaction, backfilling the cycle it falls into", async () => {
    const { layer, transactionsFake, cyclesFake } = buildLayer()
    stageTransaction(transactionsFake, {})

    const confirmed = await Effect.runPromise(
      confirmTransaction({
        transactionId: "staged-1",
        householdId,
        baseCurrency: "BRL",
        anchorDay: 23,
        categoryId,
        currentUserId: ownerUserId,
      }).pipe(Effect.provide(layer)),
    )

    expect(confirmed.status).toBe("confirmed")
    expect(confirmed.sharedPaymentId).toBeNull()
    expect(cyclesFake.cycles.size).toBe(1)
  })

  it("confirms a shared debit into a real shared payment", async () => {
    const { layer, transactionsFake, paymentsFake } = buildLayer()
    stageTransaction(transactionsFake, {
      accountId: sharedAccount.id,
      visibility: "shared",
      currency: "EUR",
    })

    const confirmed = await Effect.runPromise(
      confirmTransaction({
        transactionId: "staged-1",
        householdId,
        baseCurrency: "EUR",
        anchorDay: 23,
        categoryId,
        currentUserId: ownerUserId,
      }).pipe(Effect.provide(layer)),
    )

    expect(confirmed.sharedPaymentId).not.toBeNull()
    expect(paymentsFake.payments.size).toBe(1)
  })

  it("confirms a shared credit (a refund) without creating a shared payment", async () => {
    const { layer, transactionsFake, paymentsFake } = buildLayer()
    stageTransaction(transactionsFake, {
      accountId: sharedAccount.id,
      visibility: "shared",
      currency: "EUR",
      direction: "credit",
    })

    const confirmed = await Effect.runPromise(
      confirmTransaction({
        transactionId: "staged-1",
        householdId,
        baseCurrency: "EUR",
        anchorDay: 23,
        categoryId,
        currentUserId: ownerUserId,
      }).pipe(Effect.provide(layer)),
    )

    expect(confirmed.sharedPaymentId).toBeNull()
    expect(paymentsFake.payments.size).toBe(0)
  })

  it("backfills a cycle for a booked date a year in the past", async () => {
    const { layer, transactionsFake, cyclesFake } = buildLayer()
    stageTransaction(transactionsFake, {
      bookedAt: DateTime.unsafeFromDate(new Date("2025-01-05")),
    })

    await Effect.runPromise(
      confirmTransaction({
        transactionId: "staged-1",
        householdId,
        baseCurrency: "BRL",
        anchorDay: 23,
        categoryId,
        currentUserId: ownerUserId,
      }).pipe(Effect.provide(layer)),
    )

    const cycle = [...cyclesFake.cycles.values()][0]
    expect(cycle?.cycleKey).toBe("2024-12")
  })

  it("fails with TransactionNotFound for an unknown id", async () => {
    const { layer } = buildLayer()
    const exit = await Effect.runPromiseExit(
      confirmTransaction({
        transactionId: "missing",
        householdId,
        baseCurrency: "BRL",
        anchorDay: 23,
        categoryId,
        currentUserId: ownerUserId,
      }).pipe(Effect.provide(layer)),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("fails with TransactionAlreadyProcessed once already confirmed", async () => {
    const { layer, transactionsFake } = buildLayer()
    stageTransaction(transactionsFake, { status: "confirmed" })

    const exit = await Effect.runPromiseExit(
      confirmTransaction({
        transactionId: "staged-1",
        householdId,
        baseCurrency: "BRL",
        anchorDay: 23,
        categoryId,
        currentUserId: ownerUserId,
      }).pipe(Effect.provide(layer)),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("fails with CategoryRequired when no category is given or suggested", async () => {
    const { layer, transactionsFake } = buildLayer()
    stageTransaction(transactionsFake, {})

    const exit = await Effect.runPromiseExit(
      confirmTransaction({
        transactionId: "staged-1",
        householdId,
        baseCurrency: "BRL",
        anchorDay: 23,
        categoryId: null,
        currentUserId: ownerUserId,
      }).pipe(Effect.provide(layer)),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("bulk-confirms several transactions with one category override", async () => {
    const { layer, transactionsFake } = buildLayer()
    stageTransaction(transactionsFake, { id: "staged-1" })
    stageTransaction(transactionsFake, { id: "staged-2" })

    const confirmed = await Effect.runPromise(
      bulkConfirmTransactions({
        transactionIds: ["staged-1", "staged-2"],
        householdId,
        baseCurrency: "BRL",
        anchorDay: 23,
        categoryId,
        currentUserId: ownerUserId,
      }).pipe(Effect.provide(layer)),
    )

    expect(confirmed).toHaveLength(2)
    expect(confirmed.every((t) => t.status === "confirmed")).toBe(true)
  })
})

describe("ignoreTransaction", () => {
  it("marks a staged transaction ignored", async () => {
    const { layer, transactionsFake } = buildLayer()
    transactionsFake.transactions.set("staged-1", {
      id: "staged-1",
      householdId,
      accountId: personalAccount.id,
      ownerUserId,
      visibility: "personal",
      uploadId: null,
      externalId: null,
      bookedAt: DateTime.unsafeFromDate(new Date("2026-01-05")),
      description: "Mercado",
      counterparty: null,
      amountMinor: 5000,
      currency: "BRL",
      direction: "debit",
      categoryId: null,
      categoryConfidence: null,
      isTransfer: false,
      linkedTransactionId: null,
      matchedRuleId: null,
      status: "staged",
      sharedPaymentId: null,
      dedupHash: "hash-staged-1",
      createdAt: DateTime.unsafeFromDate(new Date()),
    })

    const ignored = await Effect.runPromise(
      ignoreTransaction("staged-1").pipe(Effect.provide(layer)),
    )
    expect(ignored.status).toBe("ignored")
  })

  it("fails with TransactionNotFound for an unknown id", async () => {
    const { layer } = buildLayer()
    const exit = await Effect.runPromiseExit(
      ignoreTransaction("missing").pipe(Effect.provide(layer)),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("fails with TransactionAlreadyProcessed once already ignored", async () => {
    const { layer, transactionsFake } = buildLayer()
    transactionsFake.transactions.set("ignored-1", {
      id: "ignored-1",
      householdId,
      accountId: personalAccount.id,
      ownerUserId,
      visibility: "personal",
      uploadId: null,
      externalId: null,
      bookedAt: DateTime.unsafeFromDate(new Date("2026-01-05")),
      description: "Mercado",
      counterparty: null,
      amountMinor: 5000,
      currency: "BRL",
      direction: "debit",
      categoryId: null,
      categoryConfidence: null,
      isTransfer: false,
      linkedTransactionId: null,
      matchedRuleId: null,
      status: "ignored",
      sharedPaymentId: null,
      dedupHash: "hash-ignored-1",
      createdAt: DateTime.unsafeFromDate(new Date()),
    })

    const exit = await Effect.runPromiseExit(
      ignoreTransaction("ignored-1").pipe(Effect.provide(layer)),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })
})

describe("recategorizeStagedTransaction", () => {
  const categoryId = "66666666-6666-6666-6666-666666666666"

  it("updates a staged transaction's category", async () => {
    const { layer, transactionsFake } = buildLayer()
    transactionsFake.transactions.set("staged-1", {
      id: "staged-1",
      householdId,
      accountId: personalAccount.id,
      ownerUserId,
      visibility: "personal",
      uploadId: null,
      externalId: null,
      bookedAt: DateTime.unsafeFromDate(new Date("2026-01-05")),
      description: "Mercado",
      counterparty: null,
      amountMinor: 5000,
      currency: "BRL",
      direction: "debit",
      categoryId: null,
      categoryConfidence: null,
      isTransfer: false,
      linkedTransactionId: null,
      matchedRuleId: null,
      status: "staged",
      sharedPaymentId: null,
      dedupHash: "hash-staged-1",
      createdAt: DateTime.unsafeFromDate(new Date()),
    })

    const updated = await Effect.runPromise(
      recategorizeStagedTransaction("staged-1", categoryId).pipe(Effect.provide(layer)),
    )
    expect(updated.categoryId).toBe(categoryId)
  })

  it("fails with TransactionNotFound for an unknown id", async () => {
    const { layer } = buildLayer()
    const exit = await Effect.runPromiseExit(
      recategorizeStagedTransaction("missing", categoryId).pipe(Effect.provide(layer)),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("fails with TransactionAlreadyProcessed once already confirmed", async () => {
    const { layer, transactionsFake } = buildLayer()
    transactionsFake.transactions.set("confirmed-1", {
      id: "confirmed-1",
      householdId,
      accountId: personalAccount.id,
      ownerUserId,
      visibility: "personal",
      uploadId: null,
      externalId: null,
      bookedAt: DateTime.unsafeFromDate(new Date("2026-01-05")),
      description: "Mercado",
      counterparty: null,
      amountMinor: 5000,
      currency: "BRL",
      direction: "debit",
      categoryId,
      categoryConfidence: null,
      isTransfer: false,
      linkedTransactionId: null,
      matchedRuleId: null,
      status: "confirmed",
      sharedPaymentId: null,
      dedupHash: "hash-confirmed-1",
      createdAt: DateTime.unsafeFromDate(new Date()),
    })

    const exit = await Effect.runPromiseExit(
      recategorizeStagedTransaction("confirmed-1", categoryId).pipe(Effect.provide(layer)),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })
})
