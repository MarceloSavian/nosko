import { Result, useAtom, useAtomRefresh } from "@effect-atom/atom-react"
import type { Currency } from "@nosko/contracts"
import { useState } from "react"
import { useNavigate } from "react-router"
import {
  createHouseholdAtom,
  householdAtom,
  inviteMemberAtom,
} from "../../../data/usecases/household"
import { useTranslate } from "../../../main/LocaleProvider"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { ErrorBanner } from "../../components/ErrorBanner"
import { Input } from "../../components/Input"

const CURRENCIES: ReadonlyArray<Currency> = ["EUR", "BRL", "GBP", "USD"]

export const CreateHouseholdPage = () => {
  const t = useTranslate()
  const navigate = useNavigate()
  const refreshHousehold = useAtomRefresh(householdAtom)
  const [createResult, createHousehold] = useAtom(createHouseholdAtom, { mode: "promiseExit" })
  const [inviteResult, inviteMember] = useAtom(inviteMemberAtom, { mode: "promiseExit" })

  const [name, setName] = useState("")
  const [baseCurrency, setBaseCurrency] = useState<Currency>("EUR")
  const [inviteEmail, setInviteEmail] = useState("")
  const [householdId, setHouseholdId] = useState<string | null>(null)

  const errorMessage = Result.matchWithError(createResult, {
    onInitial: () => null,
    onSuccess: () => null,
    onError: () => t("common.unexpectedError"),
    onDefect: () => t("common.unexpectedError"),
  })
  const inviteErrorMessage = Result.matchWithError(inviteResult, {
    onInitial: () => null,
    onSuccess: () => null,
    onError: (error) =>
      error._tag === "HouseholdFull"
        ? t("onboardingHousehold.errorFull")
        : t("common.unexpectedError"),
    onDefect: () => t("common.unexpectedError"),
  })

  const handleCreateHousehold = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (name.trim() === "") return
    const exit = await createHousehold({
      payload: { name, baseCurrency },
      reactivityKeys: ["household"],
    })
    if (exit._tag === "Success") {
      setHouseholdId(exit.value.id)
      refreshHousehold()
    }
  }

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inviteEmail.trim() === "") return
    const exit = await inviteMember({ payload: { email: inviteEmail } })
    if (exit._tag === "Success") {
      navigate("/onboarding/accounts")
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        {t("onboardingHousehold.title")}
      </h1>

      {householdId === null ? (
        <Card className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("onboardingHousehold.stepHousehold")}
          </h2>
          <form className="mt-4 flex flex-col gap-4" onSubmit={handleCreateHousehold}>
            {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
            <Input
              label={t("onboardingHousehold.nameLabel")}
              placeholder={t("onboardingHousehold.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t("onboardingHousehold.currencyLabel")}
              </span>
              <div className="mt-2 flex gap-2">
                {CURRENCIES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setBaseCurrency(option)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      baseCurrency === option
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" loading={Result.isWaiting(createResult)}>
              {t("common.continue")}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="mt-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("onboardingHousehold.stepInvite")}
          </h2>
          <form className="mt-4 flex flex-col gap-4" onSubmit={handleInvite}>
            {inviteErrorMessage ? <ErrorBanner message={inviteErrorMessage} /> : null}
            <Input
              label={t("onboardingHousehold.inviteEmailLabel")}
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {t("onboardingHousehold.reassurance")}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/onboarding/accounts")}
              >
                {t("onboardingHousehold.skip")}
              </Button>
              <Button type="submit" loading={Result.isWaiting(inviteResult)} className="flex-1">
                {t("onboardingHousehold.submit")}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
