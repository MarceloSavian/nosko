import { Schema } from "effect"

export const CycleStatus = Schema.Literal("open", "closed")
export type CycleStatus = typeof CycleStatus.Type

export const IncomeKind = Schema.Literal("salary", "bonus")
export type IncomeKind = typeof IncomeKind.Type

export const TransferDirection = Schema.Literal("to_personal", "to_household")
export type TransferDirection = typeof TransferDirection.Type

export const Cycle = Schema.Struct({
  id: Schema.UUID,
  householdId: Schema.UUID,
  cycleKey: Schema.String,
  title: Schema.NullOr(Schema.String),
  startDate: Schema.DateTimeUtcFromDate,
  endDate: Schema.DateTimeUtcFromDate,
  status: CycleStatus,
  closedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  reserveMinor: Schema.Int,
  estimateMinor: Schema.NullOr(Schema.Int),
  seedOpeningBalanceMinor: Schema.NullOr(Schema.Int),
  surplusGoalId: Schema.NullOr(Schema.UUID),
  surplusDestinationLabel: Schema.NullOr(Schema.String),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
})
export type Cycle = typeof Cycle.Type

export interface NewCycle {
  readonly householdId: string
  readonly cycleKey: string
  readonly title: string | null
  readonly startDate: Date
  readonly endDate: Date
  readonly reserveMinor: number
  readonly estimateMinor: number | null
  readonly seedOpeningBalanceMinor: number | null
}

export interface CycleUpdate {
  readonly title: string | null
  readonly reserveMinor: number
  readonly estimateMinor: number | null
  readonly surplusGoalId: string | null
  readonly surplusDestinationLabel: string | null
}

export const CycleIncome = Schema.Struct({
  id: Schema.UUID,
  cycleId: Schema.UUID,
  memberUserId: Schema.UUID,
  kind: IncomeKind,
  amountMinor: Schema.Int,
  currency: Schema.String,
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
})
export type CycleIncome = typeof CycleIncome.Type

export interface NewCycleIncome {
  readonly cycleId: string
  readonly householdId: string
  readonly memberUserId: string
  readonly kind: IncomeKind
  readonly amountMinor: number
  readonly currency: string
}

export const MemberTransfer = Schema.Struct({
  id: Schema.UUID,
  cycleId: Schema.UUID,
  memberUserId: Schema.UUID,
  direction: TransferDirection,
  amountMinor: Schema.Int,
  currency: Schema.String,
  settledAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  method: Schema.NullOr(Schema.String),
  createdAt: Schema.DateTimeUtcFromDate,
})
export type MemberTransfer = typeof MemberTransfer.Type

export interface NewMemberTransfer {
  readonly cycleId: string
  readonly householdId: string
  readonly memberUserId: string
  readonly direction: TransferDirection
  readonly amountMinor: number
  readonly currency: string
  readonly method: string | null
}
