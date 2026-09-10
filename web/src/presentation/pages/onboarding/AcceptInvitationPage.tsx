import { Result, useAtom, useAtomRefresh } from "@effect-atom/atom-react"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { acceptInvitationAtom, householdAtom } from "../../../data/usecases/household"
import { useTranslate } from "../../../main/LocaleProvider"
import { AuthCard, AuthLayout } from "../../components/AuthLayout"
import { Button } from "../../components/Button"
import { ErrorBanner } from "../../components/ErrorBanner"
import { OtpInput } from "../../components/OtpInput"

export const AcceptInvitationPage = () => {
  const t = useTranslate()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const householdId = searchParams.get("householdId") ?? ""
  const refreshHousehold = useAtomRefresh(householdAtom)

  const [code, setCode] = useState("")
  const [result, acceptInvitation] = useAtom(acceptInvitationAtom, { mode: "promiseExit" })

  const errorMessage = Result.matchWithError(result, {
    onInitial: () => null,
    onSuccess: () => null,
    onError: () => t("acceptInvitation.errorInvalid"),
    onDefect: () => t("common.unexpectedError"),
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.length !== 6 || householdId === "") return
    const exit = await acceptInvitation({ payload: { householdId, code } })
    if (exit._tag === "Success") {
      refreshHousehold()
      navigate("/onboarding/accounts")
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("acceptInvitation.title")}
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("acceptInvitation.subtitle")}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {t("acceptInvitation.sharedTitle")}
            </h2>
            <ul className="mt-2 list-disc pl-4 text-xs text-emerald-700 dark:text-emerald-400">
              <li>{t("acceptInvitation.sharedItem1")}</li>
              <li>{t("acceptInvitation.sharedItem2")}</li>
              <li>{t("acceptInvitation.sharedItem3")}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
            <h2 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
              {t("acceptInvitation.privateTitle")}
            </h2>
            <ul className="mt-2 list-disc pl-4 text-xs text-indigo-700 dark:text-indigo-400">
              <li>{t("acceptInvitation.privateItem1")}</li>
              <li>{t("acceptInvitation.privateItem2")}</li>
              <li>{t("acceptInvitation.privateItem3")}</li>
            </ul>
          </div>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
          <span className="text-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("acceptInvitation.codeLabel")}
          </span>
          <OtpInput value={code} onChange={setCode} autoFocus />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate("/household")}>
              {t("acceptInvitation.decline")}
            </Button>
            <Button
              type="submit"
              loading={Result.isWaiting(result)}
              disabled={code.length !== 6}
              className="flex-1"
            >
              {t("acceptInvitation.accept")}
            </Button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
