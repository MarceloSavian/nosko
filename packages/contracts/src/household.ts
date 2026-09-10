import * as Rpc from "@effect/rpc/Rpc"
import * as RpcGroup from "@effect/rpc/RpcGroup"
import { Schema } from "effect"
import { AuthMiddleware } from "./authMiddleware.ts"
import {
  HouseholdFull,
  InvitationInvalid,
  NoHousehold,
  NotHouseholdOwner,
} from "./errors/householdErrors.ts"

export const HouseholdView = Schema.Struct({
  id: Schema.UUID,
  name: Schema.String,
  baseCurrency: Schema.String,
})
export type HouseholdView = typeof HouseholdView.Type

export const HouseholdMemberRole = Schema.Literal("owner", "member")
export type HouseholdMemberRole = typeof HouseholdMemberRole.Type

export const HouseholdMemberView = Schema.Struct({
  userId: Schema.UUID,
  role: HouseholdMemberRole,
  displayName: Schema.NullOr(Schema.String),
})
export type HouseholdMemberView = typeof HouseholdMemberView.Type

export const HouseholdInvitationStatus = Schema.Literal("pending", "accepted", "revoked", "expired")
export type HouseholdInvitationStatus = typeof HouseholdInvitationStatus.Type

export const HouseholdInvitationView = Schema.Struct({
  id: Schema.UUID,
  email: Schema.String,
  status: HouseholdInvitationStatus,
  expiresAt: Schema.DateTimeUtc,
})
export type HouseholdInvitationView = typeof HouseholdInvitationView.Type

export const HouseholdRpcs = RpcGroup.make(
  Rpc.make("household.create", {
    payload: { name: Schema.String, baseCurrency: Schema.String },
    success: HouseholdView,
  }).middleware(AuthMiddleware),
  Rpc.make("household.get", {
    success: Schema.NullOr(HouseholdView),
  }).middleware(AuthMiddleware),
  Rpc.make("household.update", {
    payload: { name: Schema.String, baseCurrency: Schema.String },
    success: HouseholdView,
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("household.invite", {
    payload: { email: Schema.String },
    success: HouseholdInvitationView,
    error: Schema.Union(NoHousehold, NotHouseholdOwner, HouseholdFull),
  }).middleware(AuthMiddleware),
  Rpc.make("household.listInvitations", {
    success: Schema.Array(HouseholdInvitationView),
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("household.revokeInvitation", {
    payload: { invitationId: Schema.UUID },
    error: NotHouseholdOwner,
  }).middleware(AuthMiddleware),
  Rpc.make("household.acceptInvitation", {
    payload: { householdId: Schema.UUID, code: Schema.String },
    success: HouseholdMemberView,
    error: InvitationInvalid,
  }).middleware(AuthMiddleware),
  Rpc.make("household.listMembers", {
    success: Schema.Array(HouseholdMemberView),
    error: NoHousehold,
  }).middleware(AuthMiddleware),
  Rpc.make("household.removeMember", {
    payload: { userId: Schema.UUID },
    error: Schema.Union(NoHousehold, NotHouseholdOwner),
  }).middleware(AuthMiddleware),
)
