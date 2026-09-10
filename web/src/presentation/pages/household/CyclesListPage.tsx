import { Result, useAtomValue } from "@effect-atom/atom-react"
import { Link } from "react-router"
import { listCyclesAtom } from "../../../data/usecases/cycles"
import { useLocale, useTranslate } from "../../../main/LocaleProvider"
import { Card } from "../../components/Card"
import { formatPercent } from "../../format"

export const CyclesListPage = () => {
  const t = useTranslate()
  const { locale } = useLocale()
  const cycles = useAtomValue(listCyclesAtom)

  const list = Result.isSuccess(cycles) ? cycles.value : []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("cyclesList.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("cyclesList.subtitle")}
        </p>
      </div>

      {list.length === 0 ? (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
          {t("cyclesList.empty")}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((cycle) => (
            <Link key={cycle.id} to={`/household/cycles/${cycle.id}`}>
              <Card className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                <div>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {cycle.title ?? cycle.cycleKey}
                  </span>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      cycle.status === "open"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {cycle.status === "open"
                      ? t("cyclesList.statusOpen")
                      : t("cyclesList.statusClosed")}
                  </span>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("cyclesList.savingsRate")}: {formatPercent(cycle.savingsRate, locale)}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
