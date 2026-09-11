import { Result, useAtomValue } from "@effect-atom/atom-react"
import { Link } from "react-router"
import { listMyPaymentsAtom } from "../../../data/usecases/ingestion"
import { useLocale, useTranslate } from "../../../main/LocaleProvider"
import { Card } from "../../components/Card"
import { formatDate, formatMoney } from "../../format"

export const MyPaymentsPage = () => {
  const t = useTranslate()
  const { locale } = useLocale()
  const payments = useAtomValue(listMyPaymentsAtom)
  const list = Result.isSuccess(payments) ? payments.value : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {t("shell.nav.myPayments")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("myPayments.subtitle")}
          </p>
        </div>
        <Link
          to="/import"
          className="text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-400"
        >
          {t("shell.nav.import")}
        </Link>
      </div>

      {list.length === 0 ? (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
          {t("myPayments.empty")}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((payment) => (
            <Card key={payment.id} className="flex items-center justify-between p-4">
              <div>
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {payment.description}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(payment.bookedAt, locale)}
                  {payment.counterparty ? ` · ${payment.counterparty}` : ""}
                </span>
              </div>
              <span className="tabular-nums text-sm font-medium text-slate-700 dark:text-slate-300">
                {payment.direction === "credit" ? "+" : "−"}
                {formatMoney(payment.amountMinor, payment.currency, locale)}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
