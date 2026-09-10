import { ApiClient } from "../../infra/http/apiClient"

export const listPaymentsAtom = (cycleId: string) =>
  ApiClient.query("payments.list", { cycleId }, { reactivityKeys: ["payments"] })
export const paymentsSummaryAtom = (cycleId: string) =>
  ApiClient.query("payments.summary", { cycleId }, { reactivityKeys: ["payments"] })
export const createPaymentAtom = ApiClient.mutation("payments.create")
export const removePaymentAtom = ApiClient.mutation("payments.remove")
