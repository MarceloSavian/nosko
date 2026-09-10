import * as Rpc from "@effect/rpc/Rpc"
import * as RpcGroup from "@effect/rpc/RpcGroup"
import { Schema } from "effect"
import { AuthMiddleware } from "./authMiddleware"
import { FixedBillNotFound } from "./errors/billErrors"
import { CycleClosed, CycleNotFound } from "./errors/cycleErrors"
import { NoHousehold } from "./errors/householdErrors"

export const FixedBillView = Schema.Struct({
  id: Schema.UUID,
  cycleId: Schema.UUID,
  recurringRuleId: Schema.NullOr(Schema.UUID),
  label: Schema.String,
  amountMinor: Schema.Int,
  currency: Schema.String,
  paid: Schema.Boolean,
  paidOnDay: Schema.NullOr(Schema.Int),
  payingAccountId: Schema.NullOr(Schema.UUID),
  dueDay: Schema.NullOr(Schema.Int),
  autoPaid: Schema.Boolean,
  categoryId: Schema.NullOr(Schema.UUID),
  sortOrder: Schema.Int,
})
export type FixedBillView = typeof FixedBillView.Type

const newFixedBillPayload = {
  cycleId: Schema.UUID,
  recurringRuleId: Schema.NullOr(Schema.UUID),
  label: Schema.String,
  amountMinor: Schema.Int,
  payingAccountId: Schema.NullOr(Schema.UUID),
  dueDay: Schema.NullOr(Schema.Int),
  categoryId: Schema.NullOr(Schema.UUID),
  sortOrder: Schema.Int,
}

const fixedBillUpdatePayload = {
  label: Schema.String,
  amountMinor: Schema.Int,
  payingAccountId: Schema.NullOr(Schema.UUID),
  dueDay: Schema.NullOr(Schema.Int),
  categoryId: Schema.NullOr(Schema.UUID),
  sortOrder: Schema.Int,
}

export const BillsRpcs = RpcGroup.make(
  Rpc.make("bills.list", {
    payload: { cycleId: Schema.UUID },
    success: Schema.Array(FixedBillView),
    error: Schema.Union(NoHousehold, CycleNotFound),
  }).middleware(AuthMiddleware),
  Rpc.make("bills.create", {
    payload: newFixedBillPayload,
    success: FixedBillView,
    error: Schema.Union(NoHousehold, CycleNotFound, CycleClosed),
  }).middleware(AuthMiddleware),
  Rpc.make("bills.update", {
    payload: { id: Schema.UUID, ...fixedBillUpdatePayload },
    success: FixedBillView,
    error: Schema.Union(FixedBillNotFound, CycleClosed),
  }).middleware(AuthMiddleware),
  Rpc.make("bills.setPaid", {
    payload: { id: Schema.UUID, paid: Schema.Boolean, paidOnDay: Schema.NullOr(Schema.Int) },
    success: FixedBillView,
    error: FixedBillNotFound,
  }).middleware(AuthMiddleware),
  Rpc.make("bills.remove", {
    payload: { id: Schema.UUID },
    error: Schema.Union(FixedBillNotFound, CycleClosed),
  }).middleware(AuthMiddleware),
)
