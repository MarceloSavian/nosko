import * as Rpc from "@effect/rpc/Rpc"
import * as RpcGroup from "@effect/rpc/RpcGroup"
import { Schema } from "effect"
import { AuthMiddleware } from "./authMiddleware.ts"
import {
  CycleAlreadyExists,
  CycleClosed,
  CycleNotFound,
  MemberTransferNotFound,
} from "./errors/cycleErrors.ts"
import { NoHousehold } from "./errors/householdErrors.ts"

export const CycleStatus = Schema.Literal("open", "closed")
export type CycleStatus = typeof CycleStatus.Type

export const IncomeKind = Schema.Literal("salary", "bonus")
export type IncomeKind = typeof IncomeKind.Type

export const TransferDirection = Schema.Literal("to_personal", "to_household")
export type TransferDirection = typeof TransferDirection.Type

export const CycleView = Schema.Struct({
  id: Schema.UUID,
  cycleKey: Schema.String,
  title: Schema.NullOr(Schema.String),
  startDate: Schema.DateTimeUtc,
  endDate: Schema.DateTimeUtc,
  status: CycleStatus,
  closedAt: Schema.NullOr(Schema.DateTimeUtc),
  reserveMinor: Schema.Int,
  estimateMinor: Schema.NullOr(Schema.Int),
  seedOpeningBalanceMinor: Schema.NullOr(Schema.Int),
  surplusGoalId: Schema.NullOr(Schema.UUID),
  surplusDestinationLabel: Schema.NullOr(Schema.String),
})
export type CycleView = typeof CycleView.Type

export const ContributionShareView = Schema.Struct({
  memberUserId: Schema.UUID,
  share: Schema.Number,
})
export type ContributionShareView = typeof ContributionShareView.Type

export const CycleFiguresView = Schema.Struct({
  income: Schema.Int,
  contributionShares: Schema.Array(ContributionShareView),
  fixedTotal: Schema.Int,
  estimate: Schema.Int,
  reserve: Schema.Int,
  openingBalance: Schema.Int,
  availableAfterPayments: Schema.Int,
  withdrawalTotal: Schema.Int,
  unallocated: Schema.Int,
  available: Schema.Int,
  variableTotal: Schema.Int,
  totalSpent: Schema.Int,
  surplus: Schema.Int,
  variableBudget: Schema.Int,
  savingsRate: Schema.Number,
  dailyAllowance: Schema.Int,
})
export type CycleFiguresView = typeof CycleFiguresView.Type

export const CycleIncomeView = Schema.Struct({
  id: Schema.UUID,
  memberUserId: Schema.UUID,
  kind: IncomeKind,
  amountMinor: Schema.Int,
  currency: Schema.String,
})
export type CycleIncomeView = typeof CycleIncomeView.Type

export const MemberTransferView = Schema.Struct({
  id: Schema.UUID,
  memberUserId: Schema.UUID,
  direction: TransferDirection,
  amountMinor: Schema.Int,
  currency: Schema.String,
  settledAt: Schema.NullOr(Schema.DateTimeUtc),
  method: Schema.NullOr(Schema.String),
})
export type MemberTransferView = typeof MemberTransferView.Type

export const CategoryCapView = Schema.Struct({
  categoryId: Schema.UUID,
  capMinor: Schema.Int,
})
export type CategoryCapView = typeof CategoryCapView.Type

export const CycleSummaryView = Schema.Struct({
  id: Schema.UUID,
  cycleKey: Schema.String,
  title: Schema.NullOr(Schema.String),
  startDate: Schema.DateTimeUtc,
  endDate: Schema.DateTimeUtc,
  status: CycleStatus,
  surplus: Schema.Int,
  savingsRate: Schema.Number,
})
export type CycleSummaryView = typeof CycleSummaryView.Type

export const CycleDetailView = Schema.Struct({
  cycle: CycleView,
  figures: CycleFiguresView,
  incomes: Schema.Array(CycleIncomeView),
  transfers: Schema.Array(MemberTransferView),
  caps: Schema.Array(CategoryCapView),
})
export type CycleDetailView = typeof CycleDetailView.Type

export const CycleTrendEntry = Schema.Struct({
  cycleId: Schema.UUID,
  cycleKey: Schema.String,
  surplus: Schema.Int,
  savingsRate: Schema.Number,
})
export type CycleTrendEntry = typeof CycleTrendEntry.Type

export const CycleTrendsView = Schema.Struct({
  cycles: Schema.Array(CycleTrendEntry),
  averageSavingsRate: Schema.Number,
  yearlyTotalSavedMinor: Schema.Int,
})
export type CycleTrendsView = typeof CycleTrendsView.Type

export const CycleCompareView = Schema.Struct({
  a: CycleDetailView,
  b: CycleDetailView,
})
export type CycleCompareView = typeof CycleCompareView.Type

const categoryCapInput = Schema.Struct({ categoryId: Schema.UUID, capMinor: Schema.Int })

export const CyclesRpcs = RpcGroup.make(
  Rpc.make("cycles.list", {
    success: Schema.Array(CycleSummaryView),
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.get", {
    payload: { id: Schema.UUID },
    success: CycleDetailView,
    error: Schema.Union(NoHousehold, CycleNotFound),
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.getCurrent", {
    success: Schema.NullOr(CycleDetailView),
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.create", {
    payload: {
      title: Schema.NullOr(Schema.String),
      reserveMinor: Schema.NullOr(Schema.Int),
      estimateMinor: Schema.NullOr(Schema.Int),
      seedOpeningBalanceMinor: Schema.NullOr(Schema.Int),
    },
    success: CycleView,
    error: Schema.Union(NoHousehold, CycleAlreadyExists),
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.update", {
    payload: {
      id: Schema.UUID,
      title: Schema.NullOr(Schema.String),
      reserveMinor: Schema.Int,
      estimateMinor: Schema.NullOr(Schema.Int),
      surplusGoalId: Schema.NullOr(Schema.UUID),
      surplusDestinationLabel: Schema.NullOr(Schema.String),
    },
    success: CycleView,
    error: Schema.Union(CycleNotFound, CycleClosed),
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.close", {
    payload: { id: Schema.UUID },
    success: CycleView,
    error: Schema.Union(CycleNotFound, CycleClosed),
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.setIncome", {
    payload: {
      cycleId: Schema.UUID,
      memberUserId: Schema.UUID,
      kind: IncomeKind,
      amountMinor: Schema.Int,
    },
    success: CycleIncomeView,
    error: Schema.Union(CycleNotFound, CycleClosed),
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.recordTransfer", {
    payload: {
      cycleId: Schema.UUID,
      memberUserId: Schema.UUID,
      direction: TransferDirection,
      amountMinor: Schema.Int,
      method: Schema.NullOr(Schema.String),
    },
    success: MemberTransferView,
    error: Schema.Union(CycleNotFound, CycleClosed),
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.settleTransfer", {
    payload: { transferId: Schema.UUID },
    success: MemberTransferView,
    error: MemberTransferNotFound,
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.setCategoryCaps", {
    payload: { cycleId: Schema.UUID, caps: Schema.Array(categoryCapInput) },
    success: Schema.Array(CategoryCapView),
    error: CycleNotFound,
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.trends", {
    success: CycleTrendsView,
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("cycles.compare", {
    payload: { cycleIdA: Schema.UUID, cycleIdB: Schema.UUID },
    success: CycleCompareView,
    error: Schema.Union(NoHousehold, CycleNotFound),
  }).middleware(AuthMiddleware),
)
