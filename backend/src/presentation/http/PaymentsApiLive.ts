import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder"
import * as HttpServerRequest from "@effect/platform/HttpServerRequest"
import { NoskoHttpApi } from "@nosko/contracts"
import { DateTime, Effect, Option } from "effect"
import { CyclesRepository } from "../../data/protocols/CyclesRepository"
import { SharedPaymentsRepository } from "../../data/protocols/SharedPaymentsRepository"
import { SessionInvalid } from "../../domain/errors/AuthErrors"
import { CycleNotFound } from "../../domain/errors/CycleErrors"
import { NoHousehold } from "../../domain/errors/HouseholdErrors"
import type { SharedPayment } from "../../domain/models/SharedPayment"
import { AccessTokens } from "../../infra/auth/AccessTokens"
import { readAccessTokenFromHeaders } from "../../infra/auth/SessionCookies"
import { withAuthenticatedScope } from "../../infra/db/RequestScope"
import { dieOnSqlError } from "../rpc/dieOnSqlError"

const currentRequestHeaders = Effect.map(
  HttpServerRequest.HttpServerRequest,
  (request) => request.headers,
)

const csvField = (value: string) =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

const CSV_HEADER = [
  "booked_at",
  "description",
  "counterparty",
  "amount_minor",
  "currency",
  "amount_base_minor",
  "category_id",
]

const toCsv = (payments: ReadonlyArray<SharedPayment>) => {
  const rows = payments.map((payment) =>
    [
      DateTime.formatIsoDateUtc(payment.bookedAt),
      payment.description,
      payment.counterparty ?? "",
      String(payment.amountMinor),
      payment.currency,
      String(payment.amountBaseMinor),
      payment.categoryId,
    ]
      .map(csvField)
      .join(","),
  )
  return [CSV_HEADER.join(","), ...rows].join("\n")
}

export const PaymentsApiLive = HttpApiBuilder.group(NoskoHttpApi, "payments", (handlers) =>
  Effect.gen(function* () {
    const accessTokens = yield* AccessTokens
    const cycles = yield* CyclesRepository
    const payments = yield* SharedPaymentsRepository

    return handlers.handle("exportCsv", ({ urlParams }) =>
      Effect.gen(function* () {
        const headers = yield* currentRequestHeaders
        const token = readAccessTokenFromHeaders(headers)
        if (Option.isNone(token)) {
          return yield* Effect.fail(new SessionInvalid({ reason: "not_found" }))
        }
        const claims = yield* accessTokens.verify(token.value)

        return yield* withAuthenticatedScope(claims.userId, (householdId) =>
          Effect.gen(function* () {
            if (householdId === null) {
              return yield* Effect.fail(new NoHousehold({}))
            }
            const cycle = yield* cycles.findById(urlParams.cycleId).pipe(dieOnSqlError)
            if (Option.isNone(cycle)) {
              return yield* Effect.fail(new CycleNotFound({}))
            }
            const rows = yield* payments.listByCycle(urlParams.cycleId).pipe(dieOnSqlError)
            return toCsv(rows)
          }),
        )
      }),
    )
  }),
)
