import { Result, useAtom } from "@effect-atom/atom-react"
import type { AccountInstitution, AccountType, AccountVisibility, Currency } from "@nosko/contracts"
import { useState } from "react"
import { useNavigate } from "react-router"
import { createAccountAtom } from "../../../data/usecases/accounts"
import { useTranslate } from "../../../main/LocaleProvider"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { ErrorBanner } from "../../components/ErrorBanner"
import { Input } from "../../components/Input"

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
const CURRENCIES: ReadonlyArray<Currency> = ["EUR", "BRL", "GBP", "USD"]

const institutionKey = (institution: AccountInstitution) =>
  `accountForm.institution.${institution}` as const
const typeKey = (type: AccountType) => `accountForm.type.${type}` as const

export const AccountFormPage = () => {
  const t = useTranslate()
  const navigate = useNavigate()
  const [result, createAccount] = useAtom(createAccountAtom, { mode: "promiseExit" })

  const [institution, setInstitution] = useState<AccountInstitution>("other")
  const [nickname, setNickname] = useState("")
  const [type, setType] = useState<AccountType>("checking")
  const [currency, setCurrency] = useState<Currency>("EUR")
  const [visibility, setVisibility] = useState<AccountVisibility>("shared")
  const [balance, setBalance] = useState("")
  const [creditLimit, setCreditLimit] = useState("")
  const [statementCloseDay, setStatementCloseDay] = useState("")

  const toMinor = (value: string): number | null => {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : null
  }

  const errorMessage = Result.isFailure(result) ? t("common.unexpectedError") : null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (nickname.trim() === "") return
    const exit = await createAccount({
      payload: {
        ownership: "sole",
        visibility,
        institution,
        nickname,
        type,
        currency,
        maskedId: null,
        balanceMinor: balance === "" ? null : toMinor(balance),
        purpose: null,
        statementCloseDay:
          type === "credit_card" && statementCloseDay !== ""
            ? Number.parseInt(statementCloseDay, 10)
            : null,
        creditLimitMinor:
          type === "credit_card" && creditLimit !== "" ? toMinor(creditLimit) : null,
        autopayAccountId: null,
      },
      reactivityKeys: ["accounts"],
    })
    if (exit._tag === "Success") {
      navigate("/onboarding/accounts")
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        {t("accountForm.title")}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("accountForm.subtitle")}</p>

      <form className="mt-6 flex flex-col gap-6" onSubmit={handleSubmit}>
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

        <div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("accountForm.currencyLabel")}
          </span>
          <div className="mt-2 flex gap-2">
            {CURRENCIES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCurrency(option)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  currency === option
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("accountForm.visibilityLabel")}
          </span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(["shared", "personal"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setVisibility(option)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  visibility === option
                    ? option === "shared"
                      ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/60"
                      : "border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/60"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {option === "shared"
                    ? t("accountForm.visibility.sharedTitle")
                    : t("accountForm.visibility.personalTitle")}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  {option === "shared"
                    ? t("accountForm.visibility.sharedBody")
                    : t("accountForm.visibility.personalBody")}
                </span>
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

        {type === "credit_card" ? (
          <Card className="grid grid-cols-2 gap-4 p-4">
            <Input
              label={t("accountForm.creditLimitLabel")}
              type="number"
              step="0.01"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
            />
            <Input
              label={t("accountForm.statementCloseDayLabel")}
              type="number"
              min={1}
              max={28}
              value={statementCloseDay}
              onChange={(e) => setStatementCloseDay(e.target.value)}
            />
          </Card>
        ) : null}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/onboarding/accounts")}
          >
            {t("accountForm.cancel")}
          </Button>
          <Button type="submit" loading={Result.isWaiting(result)} className="flex-1">
            {t("accountForm.submit")}
          </Button>
        </div>
      </form>
    </div>
  )
}
