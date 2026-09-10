import { ApiClient } from "../../infra/http/apiClient"

export const currentCycleAtom = ApiClient.query("cycles.getCurrent", undefined, {
  reactivityKeys: ["cycles"],
})
export const listCyclesAtom = ApiClient.query("cycles.list", undefined, {
  reactivityKeys: ["cycles"],
})
export const cycleAtom = (id: string) =>
  ApiClient.query("cycles.get", { id }, { reactivityKeys: ["cycles"] })
export const createCycleAtom = ApiClient.mutation("cycles.create")
export const closeCycleAtom = ApiClient.mutation("cycles.close")
export const setIncomeAtom = ApiClient.mutation("cycles.setIncome")
export const recordTransferAtom = ApiClient.mutation("cycles.recordTransfer")
export const settleTransferAtom = ApiClient.mutation("cycles.settleTransfer")
