import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import * as HttpServer from "@effect/platform/HttpServer"
import { describe, expect, it } from "@jest/globals"
import { NoskoHttpApi } from "@nosko/contracts"
import { ConfigProvider, DateTime, Effect, Layer } from "effect"
import { AccessTokens, AccessTokensLive } from "../../infra/auth/AccessTokens"
import { OpaqueTokensLive } from "../../infra/auth/OpaqueTokens"
import { PasswordHasherLive } from "../../infra/auth/PasswordHasher"
import { ACCESS_TOKEN_COOKIE } from "../../infra/auth/SessionCookies"
import { TotpServiceLive } from "../../infra/auth/TotpService"
import {
  makeFakeAuthTokensRepository,
  makeFakeCyclesRepository,
  makeFakeHouseholdsRepository,
  makeFakeSharedPaymentsRepository,
  makeFakeUserSessionsRepository,
  makeFakeUsersRepository,
} from "../../test/fakeRepositories"
import { makeTestSqlClient } from "../../test/sqlClientTestkit"
import { AuthApiLive } from "./AuthApiLive"
import { PaymentsApiLive } from "./PaymentsApiLive"

const withConfig = ConfigProvider.fromMap(
  new Map([["JWT_SECRET", "a-very-long-random-jwt-signing-secret-value-1234567890"]]),
)

const utc = (iso: string) => DateTime.unsafeFromDate(new Date(iso))

const marceloId = "8c9e6679-7425-40de-944b-e07fc1f90ae7"
const gabrieleId = "8c9e6679-7425-40de-944b-e07fc1f90ae8"
const householdId = "8c9e6679-7425-40de-944b-e07fc1f90ae9"
const cycleId = "11111111-1111-1111-1111-111111111111"

const buildHandler = async () => {
  const { layer: sqlLayer } = makeTestSqlClient(() => [])
  const householdsFake = makeFakeHouseholdsRepository({
    households: [
      {
        id: householdId,
        name: "Casa",
        baseCurrency: "EUR",
        createdBy: marceloId,
        createdAt: utc("2025-01-01T00:00:00.000Z"),
        updatedAt: utc("2025-01-01T00:00:00.000Z"),
      },
    ],
    members: [
      {
        householdId,
        userId: marceloId,
        role: "owner",
        displayName: null,
        joinedAt: utc("2025-01-01T00:00:00.000Z"),
      },
    ],
  })
  const cyclesFake = makeFakeCyclesRepository()
  cyclesFake.cycles.set(cycleId, {
    id: cycleId,
    householdId,
    cycleKey: "2026-01",
    title: null,
    startDate: utc("2026-01-01T00:00:00.000Z"),
    endDate: utc("2026-01-31T00:00:00.000Z"),
    status: "open",
    closedAt: null,
    reserveMinor: 0,
    estimateMinor: null,
    seedOpeningBalanceMinor: null,
    surplusGoalId: null,
    surplusDestinationLabel: null,
    createdAt: utc("2026-01-01T00:00:00.000Z"),
    updatedAt: utc("2026-01-01T00:00:00.000Z"),
  })
  const paymentsFake = makeFakeSharedPaymentsRepository()
  paymentsFake.payments.set("payment-1", {
    id: "payment-1",
    householdId,
    cycleId,
    accountId: "22222222-2222-2222-2222-222222222222",
    bookedAt: utc("2026-01-05T00:00:00.000Z"),
    description: "Mercado, Feira",
    counterparty: null,
    amountMinor: 10_000,
    currency: "EUR",
    amountBaseMinor: 10_000,
    fxRate: null,
    categoryId: "33333333-3333-3333-3333-333333333333",
    createdBy: marceloId,
    createdAt: utc("2026-01-05T00:00:00.000Z"),
    updatedAt: utc("2026-01-05T00:00:00.000Z"),
  })

  const infraLayer = Layer.mergeAll(
    sqlLayer,
    householdsFake.layer,
    cyclesFake.layer,
    paymentsFake.layer,
    makeFakeUsersRepository().layer,
    makeFakeAuthTokensRepository().layer,
    makeFakeUserSessionsRepository().layer,
    OpaqueTokensLive,
    PasswordHasherLive,
    TotpServiceLive,
    AccessTokensLive,
  ).pipe(Layer.provide(Layer.setConfigProvider(withConfig)))

  const apiLayer = Layer.mergeAll(
    HttpApiBuilder.api(NoskoHttpApi).pipe(
      Layer.provide(Layer.mergeAll(AuthApiLive, PaymentsApiLive)),
    ),
    HttpServer.layerContext,
  ).pipe(Layer.provide(infraLayer))

  const token = await Effect.runPromise(
    Effect.gen(function* () {
      const accessTokens = yield* AccessTokens
      return yield* accessTokens.sign({ userId: marceloId, sessionId: "session-1" })
    }).pipe(Effect.provide(AccessTokensLive), Effect.withConfigProvider(withConfig)),
  )
  const strangerToken = await Effect.runPromise(
    Effect.gen(function* () {
      const accessTokens = yield* AccessTokens
      return yield* accessTokens.sign({ userId: gabrieleId, sessionId: "session-2" })
    }).pipe(Effect.provide(AccessTokensLive), Effect.withConfigProvider(withConfig)),
  )

  const { handler, dispose } = HttpApiBuilder.toWebHandler(apiLayer)
  return { handler, dispose, token, strangerToken }
}

const get = (
  handler: ReturnType<typeof HttpApiBuilder.toWebHandler>["handler"],
  path: string,
  cookie?: string,
) => handler(new Request(`http://localhost${path}`, { headers: cookie ? { cookie } : {} }))

describe("PaymentsApiLive", () => {
  it("exports a cycle's shared payments as CSV", async () => {
    const { handler, dispose, token } = await buildHandler()

    const response = await get(
      handler,
      `/api/http/payments/export?cycleId=${cycleId}`,
      `${ACCESS_TOKEN_COOKIE}=${token}`,
    )
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/csv")
    expect(body).toContain(
      "booked_at,description,counterparty,amount_minor,currency,amount_base_minor,category_id",
    )
    expect(body).toContain('"Mercado, Feira"')
    await dispose()
  })

  it("fails without a session cookie", async () => {
    const { handler, dispose } = await buildHandler()

    const response = await get(handler, `/api/http/payments/export?cycleId=${cycleId}`)

    expect(response.status).not.toBe(200)
    await dispose()
  })

  it("fails with NoHousehold before the caller has one", async () => {
    const { handler, dispose, strangerToken } = await buildHandler()

    const response = await get(
      handler,
      `/api/http/payments/export?cycleId=${cycleId}`,
      `${ACCESS_TOKEN_COOKIE}=${strangerToken}`,
    )

    expect(response.status).not.toBe(200)
    await dispose()
  })

  it("fails with CycleNotFound for an unknown cycle", async () => {
    const { handler, dispose, token } = await buildHandler()

    const response = await get(
      handler,
      "/api/http/payments/export?cycleId=00000000-0000-0000-0000-000000000000",
      `${ACCESS_TOKEN_COOKIE}=${token}`,
    )

    expect(response.status).not.toBe(200)
    await dispose()
  })
})
