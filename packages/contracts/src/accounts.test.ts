import { describe, expect, it } from "@jest/globals"
import { Effect, Schema } from "effect"
import { AccountSummaryEntry, AccountsRpcs, AccountView, PersonalSummaryView } from "./accounts"

const baseAccount = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  ownerUserId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  coOwnerUserId: null,
  ownership: "sole",
  visibility: "personal",
  institution: "revolut",
  nickname: "Revolut EUR",
  type: "checking",
  currency: "EUR",
  maskedId: null,
  balanceMinor: 100000,
  purpose: null,
  statementCloseDay: null,
  creditLimitMinor: null,
  autopayAccountId: null,
  source: "manual",
  lastImportAt: null,
}

describe("AccountView", () => {
  it("decodes a wire-shaped account", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(AccountView)(baseAccount))
    expect(decoded.nickname).toBe("Revolut EUR")
  })
})

describe("AccountSummaryEntry / PersonalSummaryView", () => {
  it("decodes a personal summary", async () => {
    const entry = await Effect.runPromise(
      Schema.decodeUnknown(AccountSummaryEntry)({ account: baseAccount, balanceBaseMinor: 100000 }),
    )
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(PersonalSummaryView)({
        accounts: [entry],
        liquidBaseMinor: 100000,
        investedBaseMinor: 0,
        totalBaseMinor: 100000,
      }),
    )
    expect(decoded.accounts).toHaveLength(1)
    expect(decoded.totalBaseMinor).toBe(100000)
  })
})

describe("AccountsRpcs", () => {
  it("declares every account action from the user stories", () => {
    expect([...AccountsRpcs.requests.keys()]).toEqual([
      "accounts.list",
      "accounts.create",
      "accounts.update",
      "accounts.setVisibility",
      "accounts.setCoOwner",
      "accounts.remove",
      "accounts.sharedSummary",
      "accounts.personalSummary",
    ])
  })
})
