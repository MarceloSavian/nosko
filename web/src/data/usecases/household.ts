import { ApiClient } from "../../infra/http/apiClient"

export const householdAtom = ApiClient.query("household.get", undefined, {
  reactivityKeys: ["household"],
})
export const createHouseholdAtom = ApiClient.mutation("household.create")
export const updateHouseholdAtom = ApiClient.mutation("household.update")
export const inviteMemberAtom = ApiClient.mutation("household.invite")
export const listInvitationsAtom = ApiClient.query("household.listInvitations", undefined, {
  reactivityKeys: ["invitations"],
})
export const revokeInvitationAtom = ApiClient.mutation("household.revokeInvitation")
export const acceptInvitationAtom = ApiClient.mutation("household.acceptInvitation")
export const listMembersAtom = ApiClient.query("household.listMembers", undefined, {
  reactivityKeys: ["household"],
})
export const removeMemberAtom = ApiClient.mutation("household.removeMember")
