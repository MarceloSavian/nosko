import { Result, useAtomValue } from "@effect-atom/atom-react"
import { Link, useNavigate } from "react-router"
import { listAccountsAtom } from "../../../data/usecases/accounts"
import { useTranslate } from "../../../main/LocaleProvider"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"

export const AddAccountsPage = () => {
  const t = useTranslate()
  const navigate = useNavigate()
  const personal = useAtomValue(listAccountsAtom("personal"))
  const shared = useAtomValue(listAccountsAtom("shared"))

  const accounts = [
    ...(Result.isSuccess(personal) ? personal.value : []),
    ...(Result.isSuccess(shared) ? shared.value : []),
  ]

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        {t("onboardingAccounts.title")}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("onboardingAccounts.subtitle")}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {accounts.length === 0 ? (
          <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t("onboardingAccounts.empty")}
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id} className="flex items-center justify-between p-4">
              <div>
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {account.nickname}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {account.visibility === "personal"
                    ? t("accountForm.visibility.personalTitle")
                    : t("accountForm.visibility.sharedTitle")}
                </span>
              </div>
              {account.balanceMinor !== null ? (
                <span className="tabular-nums text-sm font-medium text-slate-700 dark:text-slate-300">
                  {(account.balanceMinor / 100).toFixed(2)} {account.currency}
                </span>
              ) : null}
            </Card>
          ))
        )}

        <Link
          to="/onboarding/accounts/new"
          className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-center text-sm font-medium text-slate-600 transition-colors hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"
        >
          + {t("onboardingAccounts.addAccount")}
        </Link>
      </div>

      <div className="mt-6 flex gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate("/household")}>
          {t("onboardingAccounts.skip")}
        </Button>
        <Button type="button" onClick={() => navigate("/household")} className="flex-1">
          {t("onboardingAccounts.continue")}
        </Button>
      </div>
    </div>
  )
}
