import * as Rpc from "@effect/rpc/Rpc"
import * as RpcGroup from "@effect/rpc/RpcGroup"
import { Schema } from "effect"
import { AuthMiddleware } from "./authMiddleware"
import { AccountNotFound } from "./errors/accountErrors"
import { CycleClosed, CycleNotFound } from "./errors/cycleErrors"
import { NoFxRate } from "./errors/fxErrors"
import { NoHousehold } from "./errors/householdErrors"
import {
  NoCycleForDate,
  SharedAccountRequired,
  SharedPaymentNotFound,
} from "./errors/paymentErrors"

export const SharedPaymentView = Schema.Struct({
  id: Schema.UUID,
  cycleId: Schema.UUID,
  accountId: Schema.UUID,
  bookedAt: Schema.DateTimeUtc,
  description: Schema.String,
  counterparty: Schema.NullOr(Schema.String),
  amountMinor: Schema.Int,
  currency: Schema.String,
  amountBaseMinor: Schema.Int,
  fxRate: Schema.NullOr(Schema.Number),
  categoryId: Schema.UUID,
})
export type SharedPaymentView = typeof SharedPaymentView.Type

export const CategorySpendView = Schema.Struct({
  categoryId: Schema.UUID,
  spentMinor: Schema.Int,
  capMinor: Schema.NullOr(Schema.Int),
})
export type CategorySpendView = typeof CategorySpendView.Type

export const PaymentsSummaryView = Schema.Struct({
  cycleTotalMinor: Schema.Int,
  estimateMinor: Schema.Int,
  averagePerDayMinor: Schema.Int,
  byCategory: Schema.Array(CategorySpendView),
})
export type PaymentsSummaryView = typeof PaymentsSummaryView.Type

const newPaymentPayload = {
  accountId: Schema.UUID,
  bookedAt: Schema.DateTimeUtc,
  description: Schema.String,
  counterparty: Schema.NullOr(Schema.String),
  amountMinor: Schema.Int,
  currency: Schema.String,
  categoryId: Schema.UUID,
}

const paymentUpdatePayload = {
  description: Schema.String,
  counterparty: Schema.NullOr(Schema.String),
  amountMinor: Schema.Int,
  currency: Schema.String,
  categoryId: Schema.UUID,
}

export const PaymentsRpcs = RpcGroup.make(
  Rpc.make("payments.list", {
    payload: { cycleId: Schema.UUID },
    success: Schema.Array(SharedPaymentView),
    error: Schema.Union(NoHousehold, CycleNotFound),
  }).middleware(AuthMiddleware),
  Rpc.make("payments.create", {
    payload: newPaymentPayload,
    success: SharedPaymentView,
    error: Schema.Union(
      NoHousehold,
      AccountNotFound,
      SharedAccountRequired,
      NoCycleForDate,
      CycleClosed,
      NoFxRate,
    ),
  }).middleware(AuthMiddleware),
  Rpc.make("payments.update", {
    payload: { id: Schema.UUID, ...paymentUpdatePayload },
    success: SharedPaymentView,
    error: Schema.Union(SharedPaymentNotFound, CycleClosed, NoFxRate),
  }).middleware(AuthMiddleware),
  Rpc.make("payments.remove", {
    payload: { id: Schema.UUID },
    error: Schema.Union(SharedPaymentNotFound, CycleClosed),
  }).middleware(AuthMiddleware),
  Rpc.make("payments.summary", {
    payload: { cycleId: Schema.UUID },
    success: PaymentsSummaryView,
    error: Schema.Union(NoHousehold, CycleNotFound),
  }).middleware(AuthMiddleware),
)
