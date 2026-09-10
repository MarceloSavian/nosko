import { Result, useAtom, useAtomValue } from "@effect-atom/atom-react"
import type { AccountInstitution, AccountType } from "@nosko/contracts"
import { useState } from "react"
import {
  createAccountAtom,
  listAccountsAtom,
  removeAccountAtom,
} from "../../../data/usecases/accounts"
import { useLocale, useTranslate } from "../../../main/LocaleProvider"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { ErrorBanner } from "../../components/ErrorBanner"
import { Input } from "../../components/Input"
import { formatMoney } from "../../format"

const INSTITUTIONS: ReadonlyArray<AccountInstitution> = [
  "ing",
  "revolut",
  "amex",
  "nubank",
  "c6",
  "abn",
  "other",
]
const TYPES: ReadonlyArray<AccountType> = [
  "checking",
  "credit_card",
  "savings",
  "brokerage",
  "investment",
  "vault",
]

const institutionKey = (institution: AccountInstitution) =>
  `accountForm.institution.${institution}` as const
const typeKey = (type: AccountType) => `accountForm.type.${type}` as const

const NewSharedAccountForm = ({ onDone }: { readonly onDone: () => void }) => {
  const t = useTranslate()
  const [institution, setInstitution] = useState<AccountInstitution>("other")
  const [nickname, setNickname] = useState("")
  const [type, setType] = useState<AccountType>("checking")
  const [balance, setBalance] = useState("")
  const [result, createAccount] = useAtom(createAccountAtom, { mode: "promiseExit" })
  const errorMessage = Result.isFailure(result) ? t("common.unexpectedError") : null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (nickname.trim() === "") return
    const parsedBalance = Number.parseFloat(balance)
    const exit = await createAccount({
      payload: {
        ownership: "sole",
        visibility: "shared",
        institution,
        nickname,
        type,
        currency: "EUR",
        maskedId: null,
        balanceMinor:
          balance === "" || !Number.isFinite(parsedBalance)
            ? null
            : Math.round(parsedBalance * 100),
        purpose: null,
        statementCloseDay: null,
        creditLimitMinor: null,
        autopayAccountId: null,
      },
      reactivityKeys: ["accounts"],
    })
    if (exit._tag === "Success") onDone()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="flex flex-col gap-4">
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
        <div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("accountForm.institutionLabel")}
          </span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {INSTITUTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setInstitution(option)}
                className={`rounded-xl border px-2 py-3 text-xs font-medium transition-colors ${
                  institution === option
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {t(institutionKey(option))}
              </button>
            ))}
          </div>
        </div>
        <Input
          label={t("accountForm.nicknameLabel")}
          placeholder={t("accountForm.nicknamePlaceholder")}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        <div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("accountForm.typeLabel")}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  type === option
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {t(typeKey(option))}
              </button>
            ))}
          </div>
        </div>
        <Input
          label={t("accountForm.balanceLabel")}
          type="number"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>
            {t("accountForm.cancel")}
          </Button>
          <Button type="submit" loading={Result.isWaiting(result)} className="flex-1">
            {t("accountForm.submit")}
          </Button>
        </div>
      </Card>
    </form>
  )
}

export const SharedAccountsPage = () => {
  const t = useTranslate()
  const { locale } = useLocale()
  const accounts = useAtomValue(listAccountsAtom("shared"))
  const [adding, setAdding] = useState(false)
  const [, removeAccount] = useAtom(removeAccountAtom, { mode: "promiseExit" })

  const list = Result.isSuccess(accounts) ? accounts.value : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {t("sharedAccounts.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("sharedAccounts.subtitle")}
          </p>
        </div>
        {!adding ? (
          <Button type="button" onClick={() => setAdding(true)}>
            {t("sharedAccounts.addAccount")}
          </Button>
        ) : null}
      </div>

      {adding ? <NewSharedAccountForm onDone={() => setAdding(false)} /> : null}

      {list.length === 0 && !adding ? (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
          {t("sharedAccounts.empty")}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((account) => (
            <Card key={account.id} className="flex items-center justify-between p-4">
              <div>
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {account.nickname}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {t(typeKey(account.type))} · {t(institutionKey(account.institution))}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {account.balanceMinor !== null ? (
                  <span className="tabular-nums text-sm font-medium text-slate-700 dark:text-slate-300">
                    {formatMoney(account.balanceMinor, account.currency, locale)}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    removeAccount({ payload: { id: account.id }, reactivityKeys: ["accounts"] })
                  }
                  className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
                >
                  {t("sharedAccounts.remove")}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
