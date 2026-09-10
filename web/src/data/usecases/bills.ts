import { ApiClient } from "../../infra/http/apiClient"

export const listBillsAtom = (cycleId: string) =>
  ApiClient.query("bills.list", { cycleId }, { reactivityKeys: ["bills"] })
export const createBillAtom = ApiClient.mutation("bills.create")
export const setBillPaidAtom = ApiClient.mutation("bills.setPaid")
export const removeBillAtom = ApiClient.mutation("bills.remove")
