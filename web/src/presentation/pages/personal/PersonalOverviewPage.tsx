import { Result, useAtomValue } from "@effect-atom/atom-react"
import { Link } from "react-router"
import { personalSummaryAtom } from "../../../data/usecases/accounts"
import { useHousehold } from "../../../main/atoms/household"
import { useLocale, useTranslate } from "../../../main/LocaleProvider"
import { Card } from "../../components/Card"
import { formatMoney } from "../../format"

const MetricCard = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <Card className="flex flex-col gap-2 p-5">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
      {value}
    </span>
  </Card>
)

export const PersonalOverviewPage = () => {
  const t = useTranslate()
  const { locale } = useLocale()
  const summaryResult = useAtomValue(personalSummaryAtom)
  const household = useHousehold()
  const baseCurrency = household.status === "present" ? household.household.baseCurrency : "EUR"

  if (Result.isInitial(summaryResult)) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t("common.loading")}</p>
  }
  if (!Result.isSuccess(summaryResult)) {
    return null
  }

  const { accounts, liquidBaseMinor, investedBaseMinor, totalBaseMinor } = summaryResult.value

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("personalOverview.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("personalOverview.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label={t("personalOverview.liquid")}
          value={formatMoney(liquidBaseMinor, baseCurrency, locale)}
        />
        <MetricCard
          label={t("personalOverview.invested")}
          value={formatMoney(investedBaseMinor, baseCurrency, locale)}
        />
        <MetricCard
          label={t("personalOverview.total")}
          value={formatMoney(totalBaseMinor, baseCurrency, locale)}
        />
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {t("personalOverview.accountsTitle")}
          </h2>
          <Link
            to="/personal/accounts"
            className="text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-400"
          >
            {t("shell.nav.myAccounts")}
          </Link>
        </div>
        {accounts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("personalOverview.empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {accounts.map((entry) => (
              <li key={entry.account.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{entry.account.nickname}</span>
                {entry.balanceBaseMinor !== null ? (
                  <span className="tabular-nums text-slate-900 dark:text-slate-50">
                    {formatMoney(entry.balanceBaseMinor, baseCurrency, locale)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex items-start gap-3 bg-indigo-50/60 dark:bg-indigo-950/30">
        <div>
          <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
            {t("personalOverview.paymentsNoticeTitle")}
          </span>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("personalOverview.paymentsNoticeBody")}
          </p>
        </div>
      </Card>
    </div>
  )
}
