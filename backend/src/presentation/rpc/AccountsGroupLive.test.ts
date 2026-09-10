import * as RpcTest from "@effect/rpc/RpcTest"
import { describe, expect, it } from "@jest/globals"
import { AccountsRpcs } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Exit, Layer, type Scope } from "effect"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import {
  makeFakeAccountsRepository,
  makeFakeFxRatesRepository,
  makeFakeHouseholdsRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AccountsGroupLive } from "./AccountsGroupLive"
import { AuthMiddlewareLive } from "./AuthMiddlewareLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const marceloId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const gabrieleId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"
const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae9"

const buildTestLayer = (
  options: { withHousehold?: boolean; withOrphanedMembership?: boolean } = {},
) => {
  const { withHousehold = true, withOrphanedMembership = false } = options
  const { layer: sqlLayer } = makeTestSqlClient(() => [])
  const accountsRepo = makeFakeAccountsRepository()
  const householdsRepo = makeFakeHouseholdsRepository({
    households:
      withHousehold && !withOrphanedMembership
        ? [
            {
              id: householdId,
              name: "Casa",
              baseCurrency: "EUR",
              createdBy: marceloId,
              createdAt: DateTime.unsafeFromDate(new Date()),
              updatedAt: DateTime.unsafeFromDate(new Date()),
            },
          ]
        : [],
    members:
      withHousehold || withOrphanedMembership
        ? [
            {
              householdId,
              userId: marceloId,
              role: "owner",
              displayName: null,
              joinedAt: DateTime.unsafeFromDate(new Date()),
            },
          ]
        : [],
  })
  const fxRatesRepo = makeFakeFxRatesRepository()

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    accountsRepo.layer,
    householdsRepo.layer,
    fxRatesRepo.layer,
    AccessTokensLive,
  )

  const testLayer = Layer.mergeAll(AccountsGroupLive, AuthMiddlewareLive).pipe(
    Layer.provide(infraLayer),
  )

  return { testLayer, accounts: accountsRepo.accounts, rates: fxRatesRepo.rates }
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

describe("AccountsGroupLive", () => {
  it("accounts.create creates a sole account for the caller's household", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client(
          "accounts.create",
          {
            ownership: "sole",
            visibility: "personal",
            institution: "revolut",
            nickname: "Revolut EUR",
            type: "checking",
            currency: "EUR",
            maskedId: null,
            balanceMinor: 100000,
            purpose: null,
            statementCloseDay: null,
            creditLimitMinor: null,
            autopayAccountId: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.nickname).toBe("Revolut EUR")
    }
  })

  it("accounts.create forces visibility to shared for joint accounts", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client(
          "accounts.create",
          {
            ownership: "joint",
            visibility: "personal",
            institution: "ing",
            nickname: "ING Conjunta",
            type: "checking",
            currency: "EUR",
            maskedId: null,
            balanceMinor: 500000,
            purpose: null,
            statementCloseDay: null,
            creditLimitMinor: null,
            autopayAccountId: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.visibility).toBe("shared")
    }
  })

  it("accounts.create fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer({ withHousehold: false })
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client(
          "accounts.create",
          {
            ownership: "sole",
            visibility: "personal",
            institution: "revolut",
            nickname: "Revolut EUR",
            type: "checking",
            currency: "EUR",
            maskedId: null,
            balanceMinor: null,
            purpose: null,
            statementCloseDay: null,
            creditLimitMinor: null,
            autopayAccountId: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("accounts.list filters by scope", async () => {
    const { testLayer, accounts } = buildTestLayer()
    const token = await signAccessToken(marceloId)
    accounts.set("11111111-1111-1111-1111-111111111111", {
      id: "11111111-1111-1111-1111-111111111111",
      householdId,
      ownerUserId: marceloId,
      coOwnerUserId: null,
      ownership: "sole",
      visibility: "personal",
      institution: "revolut",
      nickname: "Personal",
      type: "checking",
      currency: "EUR",
      maskedId: null,
      balanceMinor: 1000,
      purpose: null,
      statementCloseDay: null,
      creditLimitMinor: null,
      autopayAccountId: null,
      source: "manual",
      lastImportAt: null,
      createdAt: DateTime.unsafeFromDate(new Date()),
      updatedAt: DateTime.unsafeFromDate(new Date()),
    })
    accounts.set("22222222-2222-2222-2222-222222222222", {
      id: "22222222-2222-2222-2222-222222222222",
      householdId,
      ownerUserId: marceloId,
      coOwnerUserId: null,
      ownership: "joint",
      visibility: "shared",
      institution: "ing",
      nickname: "Shared",
      type: "checking",
      currency: "EUR",
      maskedId: null,
      balanceMinor: 2000,
      purpose: null,
      statementCloseDay: null,
      creditLimitMinor: null,
      autopayAccountId: null,
      source: "manual",
      lastImportAt: null,
      createdAt: DateTime.unsafeFromDate(new Date()),
      updatedAt: DateTime.unsafeFromDate(new Date()),
    })

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client("accounts.list", { scope: "shared" }, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value).toHaveLength(1)
      expect(exit.value[0]?.nickname).toBe("Shared")
    }
  })

  it("accounts.list fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer({ withHousehold: false })
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client("accounts.list", { scope: "personal" }, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  const accountPayload = (
    overrides: Partial<{
      ownership: "sole" | "joint"
      visibility: "personal" | "shared"
      institution: "ing" | "revolut" | "amex" | "nubank" | "c6" | "abn" | "other"
      nickname: string
      type: "checking" | "credit_card" | "savings" | "brokerage" | "investment" | "vault"
      currency: string
      maskedId: string | null
      balanceMinor: number | null
      purpose: string | null
      statementCloseDay: number | null
      creditLimitMinor: number | null
      autopayAccountId: string | null
    }> = {},
  ) => ({
    ownership: "sole" as const,
    visibility: "personal" as const,
    institution: "revolut" as const,
    nickname: "Revolut EUR",
    type: "checking" as const,
    currency: "EUR",
    maskedId: null,
    balanceMinor: 100000,
    purpose: null,
    statementCloseDay: null,
    creditLimitMinor: null,
    autopayAccountId: null,
    ...overrides,
  })

  it("accounts.update updates an existing account", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        const created = yield* client("accounts.create", accountPayload(), headersFor(token))
        return yield* client(
          "accounts.update",
          {
            id: created.id,
            nickname: "Revolut Savings",
            maskedId: null,
            balanceMinor: 200000,
            purpose: "Savings",
            statementCloseDay: null,
            creditLimitMinor: null,
            autopayAccountId: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.nickname).toBe("Revolut Savings")
    }
  })

  it("accounts.update fails with AccountNotFound for an unknown account", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client(
          "accounts.update",
          {
            id: "00000000-0000-0000-0000-000000000000",
            nickname: "Nope",
            maskedId: null,
            balanceMinor: null,
            purpose: null,
            statementCloseDay: null,
            creditLimitMinor: null,
            autopayAccountId: null,
          },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("accounts.setVisibility shares a sole account", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        const created = yield* client("accounts.create", accountPayload(), headersFor(token))
        return yield* client(
          "accounts.setVisibility",
          { id: created.id, visibility: "shared" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.visibility).toBe("shared")
    }
  })

  it("accounts.setVisibility fails with JointAccountVisibilityLocked for a joint account", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        const created = yield* client(
          "accounts.create",
          accountPayload({ ownership: "joint", visibility: "shared" }),
          headersFor(token),
        )
        return yield* client(
          "accounts.setVisibility",
          { id: created.id, visibility: "personal" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("accounts.setVisibility fails with AccountNotFound for an unknown account", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client(
          "accounts.setVisibility",
          { id: "00000000-0000-0000-0000-000000000000", visibility: "shared" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("accounts.setCoOwner attaches a co-owner", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        const created = yield* client(
          "accounts.create",
          accountPayload({ ownership: "joint", visibility: "shared" }),
          headersFor(token),
        )
        return yield* client(
          "accounts.setCoOwner",
          { id: created.id, coOwnerUserId: gabrieleId },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.coOwnerUserId).toBe(gabrieleId)
    }
  })

  it("accounts.setCoOwner fails with AccountNotFound for an unknown account", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client(
          "accounts.setCoOwner",
          { id: "00000000-0000-0000-0000-000000000000", coOwnerUserId: gabrieleId },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("accounts.remove removes an account", async () => {
    const { testLayer, accounts } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        const created = yield* client("accounts.create", accountPayload(), headersFor(token))
        yield* client("accounts.remove", { id: created.id }, headersFor(token))
        return created.id
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    expect(accounts.size).toBe(0)
  })

  it("accounts.remove fails with AccountNotFound for an unknown account", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client(
          "accounts.remove",
          { id: "00000000-0000-0000-0000-000000000000" },
          headersFor(token),
        )
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("accounts.sharedSummary sums shared accounts, converting non-base currencies", async () => {
    const { testLayer, rates } = buildTestLayer()
    const token = await signAccessToken(marceloId)
    rates.push({
      id: "rate-1",
      rateDate: DateTime.unsafeFromDate(new Date()),
      base: "EUR",
      quote: "BRL",
      rate: 5,
      createdAt: DateTime.unsafeFromDate(new Date()),
    })

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        yield* client(
          "accounts.create",
          accountPayload({
            ownership: "joint",
            visibility: "shared",
            currency: "EUR",
            balanceMinor: 100000,
          }),
          headersFor(token),
        )
        yield* client(
          "accounts.create",
          accountPayload({
            ownership: "joint",
            visibility: "shared",
            currency: "BRL",
            balanceMinor: 50000,
          }),
          headersFor(token),
        )
        return yield* client("accounts.sharedSummary", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.accounts).toHaveLength(2)
      expect(exit.value.totalBaseMinor).toBe(100000 + 10000)
    }
  })

  it("accounts.sharedSummary treats a missing fx rate as an unconverted (null) balance", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        yield* client(
          "accounts.create",
          accountPayload({
            ownership: "joint",
            visibility: "shared",
            currency: "BRL",
            balanceMinor: 50000,
          }),
          headersFor(token),
        )
        return yield* client("accounts.sharedSummary", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.accounts[0]?.balanceBaseMinor).toBeNull()
      expect(exit.value.totalBaseMinor).toBe(0)
    }
  })

  it("accounts.sharedSummary fails with NoHousehold before the caller has one", async () => {
    const { testLayer } = buildTestLayer({ withHousehold: false })
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client("accounts.sharedSummary", undefined, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })

  it("dies if the caller's household row is gone by the time the handler runs", async () => {
    const { testLayer } = buildTestLayer({ withOrphanedMembership: true })
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client("accounts.sharedSummary", undefined, headersFor(token))
      }),
    )

    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isFailure(exit)) {
      expect(exit.cause._tag).toBe("Die")
    }
  })

  it("accounts.personalSummary splits liquid vs invested and skips a null balance", async () => {
    const { testLayer } = buildTestLayer()
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        yield* client(
          "accounts.create",
          accountPayload({ type: "checking", balanceMinor: 100000 }),
          headersFor(token),
        )
        yield* client(
          "accounts.create",
          accountPayload({ type: "investment", balanceMinor: 200000 }),
          headersFor(token),
        )
        yield* client(
          "accounts.create",
          accountPayload({ type: "checking", balanceMinor: null }),
          headersFor(token),
        )
        yield* client(
          "accounts.create",
          accountPayload({ type: "brokerage", balanceMinor: null }),
          headersFor(token),
        )
        return yield* client("accounts.personalSummary", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.liquidBaseMinor).toBe(100000)
      expect(exit.value.investedBaseMinor).toBe(200000)
      expect(exit.value.totalBaseMinor).toBe(300000)
      expect(exit.value.accounts).toHaveLength(4)
    }
  })

  it("accounts.personalSummary defaults to EUR before the caller has a household", async () => {
    const { testLayer } = buildTestLayer({ withHousehold: false })
    const token = await signAccessToken(marceloId)

    const exit = await run(
      testLayer,
      Effect.gen(function* () {
        const client = yield* RpcTest.makeClient(AccountsRpcs, { flatten: true })
        return yield* client("accounts.personalSummary", undefined, headersFor(token))
      }),
    )

    expect(Exit.isSuccess(exit)).toBe(true)
    if (Exit.isSuccess(exit)) {
      expect(exit.value.totalBaseMinor).toBe(0)
    }
  })
})
