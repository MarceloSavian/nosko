import { ApiClient } from "../../infra/http/apiClient"

export const listCategoriesAtom = ApiClient.query("categories.list", undefined, {
  reactivityKeys: ["categories"],
})
