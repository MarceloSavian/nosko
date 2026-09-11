import * as RpcTest from "@effect/rpc/RpcTest"
import { describe, expect, it } from "@jest/globals"
import { IngestionRpcs } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Exit, Layer, type Scope } from "effect"
import type { CsvConfig } from "../../domain/models/Bank"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import { makeFakeFileStorage } from "../../test/fakeFileStorage"
import {
  makeFakeAccountsRepository,
  makeFakeBanksRepository,
  makeFakeCyclesRepository,
  makeFakeFxRatesRepository,
  makeFakeHouseholdsRepository,
  makeFakeSharedPaymentsRepository,
  makeFakeStatementUploadsRepository,
  makeFakeTransactionsRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthMiddlewareLive } from "./AuthMiddlewareLive"
import { IngestionGroupLive } from "./IngestionGroupLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const marceloId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"
const personalAccountId = "8c9e6679-7425-40de-944b-e07fc1f90ae9"
const sharedAccountId = "8c9e6679-7425-40de-944b-e07fc1f90aea"

const nubankCsvConfig: CsvConfig = {
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
}

const buildTestLayer = () => {
  const { layer: sqlLayer } = makeTestSqlClient(() => [])
  const accountsRepo = makeFakeAccountsRepository([
    {
      id: personalAccountId,
      householdId,
      ownerUserId: marceloId,
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
    },
    {
      id: sharedAccountId,
      householdId,
      ownerUserId: marceloId,
      coOwnerUserId: null,
      ownership: "joint",
      visibility: "shared",
      institution: "nubank",
      nickname: "ING Conjunta",
      type: "checking",
      currency: "EUR",
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
    },
  ])
  const banksRepo = makeFakeBanksRepository([
    {
      code: "nubank",
      name: "Nubank",
      supportsCsv: true,
      supportsPdf: false,
      active: true,
      csvConfig: nubankCsvConfig,
    },
    {
      code: "amex",
      name: "American Express",
      supportsCsv: false,
      supportsPdf: true,
      active: true,
      csvConfig: null,
    },
    {
      code: "abn",
      name: "ABN AMRO (retired)",
      supportsCsv: false,
      supportsPdf: false,
      active: false,
      csvConfig: null,
    },
  ])
  const uploadsRepo = makeFakeStatementUploadsRepository()
  const transactionsRepo = makeFakeTransactionsRepository()
  const fileStorage = makeFakeFileStorage()
  const cyclesRepo = makeFakeCyclesRepository()
  const paymentsRepo = makeFakeSharedPaymentsRepository()
  const fxRatesRepo = makeFakeFxRatesRepository()
  const householdsRepo = makeFakeHouseholdsRepository({
    households: [
      {
        id: householdId,
        name: "Casa",
        baseCurrency: "BRL",
        createdBy: marceloId,
        createdAt: DateTime.unsafeFromDate(new Date()),
        updatedAt: DateTime.unsafeFromDate(new Date()),
      },
    ],
    members: [
      {
        householdId,
        userId: marceloId,
        role: "owner",
        displayName: null,
        joinedAt: DateTime.unsafeFromDate(new Date()),
      },
    ],
    settings: [
      {
        householdId,
        cycleAnchorDay: 23,
        locale: "pt-BR",
        baseCurrency: "BRL",
        defaultReserveMinor: 0,
        box3AllowanceMinor: 0,
        box3Rate: 0,
        inflationRate: 0,
        updatedAt: DateTime.unsafeFromDate(new Date()),
      },
    ],
  })

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    accountsRepo.layer,
    banksRepo.layer,
    uploadsRepo.layer,
    transactionsRepo.layer,
    fileStorage.layer,
    cyclesRepo.layer,
    paymentsRepo.layer,
    fxRatesRepo.layer,
    householdsRepo.layer,
    AccessTokensLive,
  )

  const testLayer = Layer.mergeAll(IngestionGroupLive, AuthMiddlewareLive).pipe(
    Layer.provide(infraLayer),
  )

  return { testLayer, transactionsRepo, paymentsRepo, householdsRepo }
}

const signAccessToken = (userId: string) =>
  Effect.gen(function* () {
    const accessTokens = yield* AccessTokens
    return yield* accessTokens.sign({ userId, sessionId: "session-1" })
  }).pipe(
    Effect.provide(AccessTokensLive),
    Effect.withConfigProvider(withConfig),
    Effect.runPromise,
  )

const headersFor = (token: string) => ({ headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } })

const run = <A, E, R>(
  testLayer: Layer.Layer<R, unknown, never>,
  effect: Effect.Effect<A, E, R | Scope.Scope>,
) =>
  Effect.runPromiseExit(
    Effect.scoped(effect).pipe(Effect.provide(testLayer), Effect.withConfigProvider(withConfig)),
  )

describe("IngestionGroupLive", () => {
  it("ingestion.listBanks returns only active banks", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(IngestionRpcs, { flatten: true })
        return yield* client("ingestion.listBanks", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.map((b) => b.code)).toEqual(["nubank", "amex"])
    }
  })

  it("ingestion.upload parses a CSV and stages transactions", async () => {
    const { testLayer, transactionsRepo } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(IngestionRpcs, { flatten: true })
        return yield* client(
          "ingestion.upload",
          {
            accountId: personalAccountId,
            originalFilename: "extrato.csv",
            fileContent: "Data,Valor,Identificador,Descrição\n05/01/2026,50.00,ext-1,Mercado",
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.newCount).toBe(1)
    }
    expect(transactionsRepo.transactions.size).toBe(1)
  })

  it("ingestion.upload fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer()
    const strangerId = "99999999-9999-9999-9999-999999999999"
    const token = await signAccessToken(strangerId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(IngestionRpcs, { flatten: true })
        return yield* client(
          "ingestion.upload",
          { accountId: personalAccountId, originalFilename: "x.csv", fileContent: "a,b\n1,2" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("ingestion.listStaged, confirm, bulkConfirm, ignore, and recategorize", async () => {
    const { testLayer, transactionsRepo, paymentsRepo } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(IngestionRpcs, { flatten: true })
        yield* client(
          "ingestion.upload",
          {
            accountId: sharedAccountId,
            originalFilename: "extrato.csv",
            fileContent:
              "Data,Valor,Identificador,Descrição\n" +
              "05/01/2026,-10.00,ext-1,Aluguel\n" +
              "06/01/2026,-20.00,ext-2,Mercado\n" +
              "07/01/2026,-30.00,ext-3,Farmácia",
          },
          headersFor(token),
        )

        const staged = yield* client("ingestion.listStaged", undefined, headersFor(token))
        expect(staged).toHaveLength(3)

        const categoryId = "11111111-1111-1111-1111-111111111111"
        const confirmed = yield* client(
          "ingestion.confirm",
          { transactionId: staged[0]?.id as string, categoryId },
          headersFor(token),
        )
        expect(confirmed.status).toBe("confirmed")

        const bulkConfirmed = yield* client(
          "ingestion.bulkConfirm",
          { transactionIds: [staged[1]?.id as string], categoryId },
          headersFor(token),
        )
        expect(bulkConfirmed).toHaveLength(1)

        const ignored = yield* client(
          "ingestion.ignore",
          { transactionId: staged[2]?.id as string },
          headersFor(token),
        )
        expect(ignored.status).toBe("ignored")

        return "done"
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(paymentsRepo.payments.size).toBe(2)
    expect(
      [...transactionsRepo.transactions.values()].filter((t) => t.status === "confirmed"),
    ).toHaveLength(2)
  })

  it("ingestion.recategorize updates a staged transaction's category", async () => {
    const { testLayer, transactionsRepo } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(IngestionRpcs, { flatten: true })
        yield* client(
          "ingestion.upload",
          {
            accountId: personalAccountId,
            originalFilename: "extrato.csv",
            fileContent: "Data,Valor,Identificador,Descrição\n05/01/2026,50.00,ext-1,Mercado",
          },
          headersFor(token),
        )
        const staged = yield* client("ingestion.listStaged", undefined, headersFor(token))
        const categoryId = "22222222-2222-2222-2222-222222222222"
        return yield* client(
          "ingestion.recategorize",
          { transactionId: staged[0]?.id as string, categoryId },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.categoryId).toBe("22222222-2222-2222-2222-222222222222")
    }
    expect(transactionsRepo.transactions.size).toBe(1)
  })

  it("dies if the household's settings row is gone by the time confirm runs", async () => {
    const { testLayer, householdsRepo } = buildTestLayer()
    householdsRepo.settings.delete(householdId)
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(IngestionRpcs, { flatten: true })
        return yield* client(
          "ingestion.confirm",
          {
            transactionId: "00000000-0000-0000-0000-000000000000",
            categoryId: "22222222-2222-2222-2222-222222222222",
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause._tag).toBe("Die")
    }
  })
})
