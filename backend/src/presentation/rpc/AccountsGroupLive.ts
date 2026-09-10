import { AccountsRpcs, CurrentUser } from "@nosko/contracts"
import { Effect, Option } from "effect"
import { AccountsRepository } from "../../data/protocols/AccountsRepository"
import { FxRatesRepository } from "../../data/protocols/FxRatesRepository"
import { HouseholdsRepository } from "../../data/protocols/HouseholdsRepository"
import { AccountNotFound, JointAccountVisibilityLocked } from "../../domain/errors/AccountErrors"
import { NoHousehold } from "../../domain/errors/HouseholdErrors"
import type { Account } from "../../domain/models/Account"
import { convertToBase } from "../../domain/services/FxConversion"
import { dieOnSqlError } from "./dieOnSqlError"

const LIQUID_TYPES = new Set(["checking", "savings", "vault"])
const INVESTED_TYPES = new Set(["brokerage", "investment"])

const toAccountView = (account: Account) => ({
  id: account.id,
  ownerUserId: account.ownerUserId,
  coOwnerUserId: account.coOwnerUserId,
  ownership: account.ownership,
  visibility: account.visibility,
  institution: account.institution,
  nickname: account.nickname,
  type: account.type,
  currency: account.currency,
  maskedId: account.maskedId,
  balanceMinor: account.balanceMinor,
  purpose: account.purpose,
  statementCloseDay: account.statementCloseDay,
  creditLimitMinor: account.creditLimitMinor,
  autopayAccountId: account.autopayAccountId,
  source: account.source,
  lastImportAt: account.lastImportAt,
})

const dieIfMissing = <A>(found: Option.Option<A>) =>
  Option.match(found, {
    onNone: () => Effect.die(new Error("expected row vanished mid-request")),
    onSome: Effect.succeed,
  })

export const AccountsGroupLive = AccountsRpcs.toLayer(
  Effect.gen(function* () {
    const accounts = yield* AccountsRepository
    const households = yield* HouseholdsRepository
    const fxRates = yield* FxRatesRepository

    const requireAccount = (id: string) =>
      accounts.findById(id).pipe(
        dieOnSqlError,
        Effect.flatMap((found) =>
          Option.isNone(found) ? Effect.fail(new AccountNotFound({})) : Effect.succeed(found.value),
        ),
      )

    const baseCurrencyFor = (householdId: string) =>
      households.findById(householdId).pipe(
        dieOnSqlError,
        Effect.flatMap(dieIfMissing),
        Effect.map((h) => h.baseCurrency),
      )

    const toBase = (baseCurrency: string, account: Account) =>
      Effect.gen(function* () {
        if (account.balanceMinor === null) {
          return null
        }
        if (account.currency === baseCurrency) {
          return account.balanceMinor
        }
        const rate = yield* fxRates
          .findOnOrBefore(baseCurrency, account.currency, new Date())
          .pipe(dieOnSqlError)
        const converted = yield* convertToBase(
          { amountMinor: account.balanceMinor, currency: account.currency as never },
          baseCurrency as never,
          Option.isSome(rate) ? { rate: rate.value.rate } : null,
        ).pipe(Effect.catchTag("NoFxRate", () => Effect.succeed(null)))
        return converted === null ? null : converted.amountBase.amountMinor
      })

    return {
      "accounts.list": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          if (currentUser.householdId === null) {
            return yield* Effect.fail(new NoHousehold({}))
          }
          const all = yield* accounts.list().pipe(dieOnSqlError)
          return all.filter((a) => a.visibility === payload.scope).map(toAccountView)
        }),

      "accounts.create": (payload) =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          if (currentUser.householdId === null) {
            return yield* Effect.fail(new NoHousehold({}))
          }
          const visibility = payload.ownership === "joint" ? "shared" : payload.visibility
          const created = yield* accounts
            .create({
              householdId: currentUser.householdId,
              ownerUserId: currentUser.userId,
              ownership: payload.ownership,
              visibility,
              institution: payload.institution,
              nickname: payload.nickname,
              type: payload.type,
              currency: payload.currency,
              maskedId: payload.maskedId,
              balanceMinor: payload.balanceMinor,
              purpose: payload.purpose,
              statementCloseDay: payload.statementCloseDay,
              creditLimitMinor: payload.creditLimitMinor,
              autopayAccountId: payload.autopayAccountId,
            })
            .pipe(dieOnSqlError)
          return toAccountView(created)
        }),

      "accounts.update": (payload) =>
        Effect.gen(function* () {
          yield* requireAccount(payload.id)
          const updated = yield* accounts
            .update(payload.id, {
              nickname: payload.nickname,
              maskedId: payload.maskedId,
              balanceMinor: payload.balanceMinor,
              purpose: payload.purpose,
              statementCloseDay: payload.statementCloseDay,
              creditLimitMinor: payload.creditLimitMinor,
              autopayAccountId: payload.autopayAccountId,
            })
            .pipe(dieOnSqlError)
          return toAccountView(updated)
        }),

      "accounts.setVisibility": (payload) =>
        Effect.gen(function* () {
          const account = yield* requireAccount(payload.id)
          if (account.ownership === "joint" && payload.visibility === "personal") {
            return yield* Effect.fail(new JointAccountVisibilityLocked({}))
          }
          const updated = yield* accounts
            .setVisibility(payload.id, payload.visibility)
            .pipe(dieOnSqlError)
          return toAccountView(updated)
        }),

      "accounts.setCoOwner": (payload) =>
        Effect.gen(function* () {
          yield* requireAccount(payload.id)
          const updated = yield* accounts
            .setCoOwner(payload.id, payload.coOwnerUserId)
            .pipe(dieOnSqlError)
          return toAccountView(updated)
        }),

      "accounts.remove": (payload) =>
        Effect.gen(function* () {
          yield* requireAccount(payload.id)
          yield* accounts.remove(payload.id).pipe(dieOnSqlError)
        }),

      "accounts.sharedSummary": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          if (currentUser.householdId === null) {
            return yield* Effect.fail(new NoHousehold({}))
          }
          const baseCurrency = yield* baseCurrencyFor(currentUser.householdId)
          const all = yield* accounts.list().pipe(dieOnSqlError)
          const shared = all.filter((a) => a.visibility === "shared" && a.type !== "credit_card")

          const entries = yield* Effect.forEach(shared, (account) =>
            Effect.map(toBase(baseCurrency, account), (balanceBaseMinor) => ({
              account: toAccountView(account),
              balanceBaseMinor,
            })),
          )

          return {
            accounts: entries,
            totalBaseMinor: entries.reduce((sum, e) => sum + (e.balanceBaseMinor ?? 0), 0),
          }
        }),

      "accounts.personalSummary": () =>
        Effect.gen(function* () {
          const currentUser = yield* CurrentUser
          const baseCurrency =
            currentUser.householdId === null
              ? "EUR"
              : yield* baseCurrencyFor(currentUser.householdId)
          const all = yield* accounts.list().pipe(dieOnSqlError)
          const personal = all.filter(
            (a) => a.visibility === "personal" && a.type !== "credit_card",
          )

          const entries = yield* Effect.forEach(personal, (account) =>
            Effect.map(toBase(baseCurrency, account), (balanceBaseMinor) => ({
              account: toAccountView(account),
              balanceBaseMinor,
            })),
          )

          const liquidBaseMinor = entries
            .filter((e) => LIQUID_TYPES.has(e.account.type))
            .reduce((sum, e) => sum + (e.balanceBaseMinor ?? 0), 0)
          const investedBaseMinor = entries
            .filter((e) => INVESTED_TYPES.has(e.account.type))
            .reduce((sum, e) => sum + (e.balanceBaseMinor ?? 0), 0)

          return {
            accounts: entries,
            liquidBaseMinor,
            investedBaseMinor,
            totalBaseMinor: liquidBaseMinor + investedBaseMinor,
          }
        }),
    }
  }),
)
