import { describe, expect, it } from "@jest/globals"
import { DateTime, Effect, Schema } from "effect"
import { Account, NewAccount } from "./Account"

const now = new Date("2026-01-01T00:00:00.000Z")

const baseRow = {
  id: "8c9e6679-7425-40de-944b-e07fc1f90ae7",
  householdId: "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  ownerUserId: "8c9e6679-7425-40de-944b-e07fc1f90ae9",
  coOwnerUserId: null,
  ownership: "sole",
  visibility: "personal",
  institution: "revolut",
  nickname: "Revolut EUR",
  type: "checking",
  currency: "EUR",
  maskedId: null,
  balanceMinor: null,
  purpose: null,
  statementCloseDay: null,
  creditLimitMinor: null,
  autopayAccountId: null,
  source: "manual",
  lastImportAt: null,
  createdAt: now,
  updatedAt: now,
}

describe("Account", () => {
  it("decodes a personal account", async () => {
    const decoded = await Effect.runPromise(Schema.decodeUnknown(Account)(baseRow))
    expect(decoded.visibility).toBe("personal")
    expect(decoded.lastImportAt).toBeNull()
  })

  it("decodes a joint account with both owners and a last import", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(Account)({
        ...baseRow,
        ownership: "joint",
        visibility: "shared",
        coOwnerUserId: "8c9e6679-7425-40de-944b-e07fc1f90aea",
        institution: "ing",
        nickname: "ING Conjunta",
        maskedId: "NL91INGB0000000812",
        balanceMinor: 382000,
        source: "file_import",
        lastImportAt: now,
      }),
    )
    expect(decoded.ownership).toBe("joint")
    expect(decoded.coOwnerUserId).toBe("8c9e6679-7425-40de-944b-e07fc1f90aea")
    expect(decoded.lastImportAt && DateTime.toDateUtc(decoded.lastImportAt)).toEqual(now)
  })

  it("rejects an institution outside the known set", async () => {
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(Account)({ ...baseRow, institution: "chase" }),
    )
    expect(exit._tag).toBe("Failure")
  })
})

describe("NewAccount", () => {
  it("decodes creation input for a credit card", async () => {
    const decoded = await Effect.runPromise(
      Schema.decodeUnknown(NewAccount)({
        householdId: baseRow.householdId,
        ownerUserId: baseRow.ownerUserId,
        ownership: "sole",
        visibility: "personal",
        institution: "amex",
        nickname: "Amex Gold",
        type: "credit_card",
        currency: "EUR",
        maskedId: null,
        balanceMinor: null,
        purpose: null,
        statementCloseDay: 23,
        creditLimitMinor: 500000,
        autopayAccountId: null,
      }),
    )
    expect(decoded.type).toBe("credit_card")
    expect(decoded.statementCloseDay).toBe(23)
  })
})
