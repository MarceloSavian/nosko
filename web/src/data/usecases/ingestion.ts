import { ApiClient } from "../../infra/http/apiClient"

export const listBanksAtom = ApiClient.query("ingestion.listBanks", undefined, {
  reactivityKeys: ["banks"],
})
export const uploadStatementAtom = ApiClient.mutation("ingestion.upload")
export const listStagedTransactionsAtom = ApiClient.query("ingestion.listStaged", undefined, {
  reactivityKeys: ["transactions"],
})
export const confirmTransactionAtom = ApiClient.mutation("ingestion.confirm")
export const bulkConfirmTransactionsAtom = ApiClient.mutation("ingestion.bulkConfirm")
export const ignoreTransactionAtom = ApiClient.mutation("ingestion.ignore")
export const recategorizeTransactionAtom = ApiClient.mutation("ingestion.recategorize")
export const listMyPaymentsAtom = ApiClient.query("ingestion.listMyPayments", undefined, {
  reactivityKeys: ["transactions"],
})
