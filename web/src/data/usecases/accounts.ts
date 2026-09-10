import { ApiClient } from "../../infra/http/apiClient"

export const listAccountsAtom = (scope: "personal" | "shared") =>
  ApiClient.query("accounts.list", { scope }, { reactivityKeys: ["accounts"] })
export const createAccountAtom = ApiClient.mutation("accounts.create")
export const updateAccountAtom = ApiClient.mutation("accounts.update")
export const removeAccountAtom = ApiClient.mutation("accounts.remove")
