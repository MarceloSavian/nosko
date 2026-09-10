import { Result, useAtom, useAtomValue } from "@effect-atom/atom-react"
import type { IncomeKind } from "@nosko/contracts"
import { useState } from "react"
import { Link } from "react-router"
import { listBillsAtom } from "../../../data/usecases/bills"
import {
  closeCycleAtom,
  createCycleAtom,
  currentCycleAtom,
  setIncomeAtom,
} from "../../../data/usecases/cycles"
import { listMembersAtom } from "../../../data/usecases/household"
import { listPaymentsAtom } from "../../../data/usecases/payments"
import { useHousehold } from "../../../main/atoms/household"
import { useLocale, useTranslate } from "../../../main/LocaleProvider"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { ErrorBanner } from "../../components/ErrorBanner"
import { Input } from "../../components/Input"
import { formatMoney, formatPercent } from "../../format"

const MetricCard = ({
  label,
  value,
  hint,
}: {
  readonly label: string
  readonly value: string
  readonly hint?: string
}) => (
  <Card className="flex flex-col justify-between gap-2 p-5">
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
      {value}
    </span>
    {hint ? <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span> : null}
  </Card>
)

const StartCycleCard = () => {
  const t = useTranslate()
  const [reserve, setReserve] = useState("")
  const [result, createCycle] = useAtom(createCycleAtom, { mode: "promiseExit" })
  const errorMessage = Result.isFailure(result) ? t("common.unexpectedError") : null

  const handleStart = async () => {
    const parsedReserve = Number.parseFloat(reserve)
    await createCycle({
      payload: {
        title: null,
        reserveMinor: Number.isFinite(parsedReserve) ? Math.round(parsedReserve * 100) : null,
        estimateMinor: null,
        seedOpeningBalanceMinor: null,
      },
      reactivityKeys: ["cycles"],
    })
  }

  return (
    <Card className="mx-auto flex max-w-lg flex-col gap-4 text-center">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        {t("casaOverview.noCycle.title")}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">{t("casaOverview.noCycle.body")}</p>
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
      <Input
        label={t("casaOverview.noCycle.reserveLabel")}
        type="number"
        step="0.01"
        value={reserve}
        onChange={(e) => setReserve(e.target.value)}
      />
      <Button type="button" loading={Result.isWaiting(result)} onClick={handleStart}>
        {t("casaOverview.noCycle.start")}
      </Button>
    </Card>
  )
}

const SetIncomeForm = ({ cycleId }: { readonly cycleId: string }) => {
  const t = useTranslate()
  const members = useAtomValue(listMembersAtom)
  const [memberUserId, setMemberUserId] = useState("")
  const [kind, setKind] = useState<IncomeKind>("salary")
  const [amount, setAmount] = useState("")
  const [result, setIncome] = useAtom(setIncomeAtom, { mode: "promiseExit" })

  const memberList = Result.isSuccess(members) ? members.value : []

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = Number.parseFloat(amount)
    if (memberUserId === "" || !Number.isFinite(parsed)) return
    await setIncome({
      payload: { cycleId, memberUserId, kind, amountMinor: Math.round(parsed * 100) },
      reactivityKeys: ["cycles"],
    })
    setAmount("")
  }

  if (memberList.length === 0) return null

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("casaOverview.membersTitle")}
        </span>
        <select
          aria-label={t("casaOverview.membersTitle")}
          value={memberUserId}
          onChange={(e) => setMemberUserId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">—</option>
          {memberList.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.displayName ?? member.userId}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("casaOverview.incomeKindLabel")}
        </span>
        <select
          aria-label={t("casaOverview.incomeKindLabel")}
          value={kind}
          onChange={(e) => setKind(e.target.value as IncomeKind)}
          className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="salary">{t("casaOverview.incomeKind.salary")}</option>
          <option value="bonus">{t("casaOverview.incomeKind.bonus")}</option>
        </select>
      </div>
      <Input
        label={t("casaOverview.incomeAmountLabel")}
        type="number"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-32"
      />
      <Button type="submit" loading={Result.isWaiting(result)}>
        {t("casaOverview.setIncome")}
      </Button>
    </form>
  )
}

export const CasaOverviewPage = () => {
  const t = useTranslate()
  const { locale } = useLocale()
  const cycleResult = useAtomValue(currentCycleAtom)
  const household = useHousehold()
  const members = useAtomValue(listMembersAtom)
  const [closeResult, closeCycle] = useAtom(closeCycleAtom, { mode: "promiseExit" })

  if (Result.isInitial(cycleResult)) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t("common.loading")}</p>
  }

  if (!Result.isSuccess(cycleResult) || cycleResult.value === null) {
    return <StartCycleCard />
  }

  const { cycle, figures } = cycleResult.value
  const baseCurrency = household.status === "present" ? household.household.baseCurrency : "EUR"
  const memberList = Result.isSuccess(members) ? members.value : []
  const displayName = (userId: string) =>
    memberList.find((m) => m.userId === userId)?.displayName ?? userId

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {t("casaOverview.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("casaOverview.subtitle")}
          </p>
        </div>
        {cycle.status === "open" ? (
          <Button
            type="button"
            variant="secondary"
            loading={Result.isWaiting(closeResult)}
            onClick={() => closeCycle({ payload: { id: cycle.id }, reactivityKeys: ["cycles"] })}
          >
            {t("casaOverview.closeCycle")}
          </Button>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {t("cyclesList.statusClosed")}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("casaOverview.income")}
          value={formatMoney(figures.income, baseCurrency, locale)}
        />
        <MetricCard
          label={t("casaOverview.fixedBills")}
          value={formatMoney(figures.fixedTotal, baseCurrency, locale)}
          hint={`${t("cycleDetail.estimate")}: ${formatMoney(figures.estimate, baseCurrency, locale)}`}
        />
        <MetricCard
          label={t("casaOverview.available")}
          value={formatMoney(figures.variableBudget - figures.totalSpent, baseCurrency, locale)}
          hint={`${formatMoney(figures.totalSpent, baseCurrency, locale)} / ${formatMoney(figures.variableBudget, baseCurrency, locale)}`}
        />
        <MetricCard
          label={t("casaOverview.surplus")}
          value={formatMoney(figures.surplus, baseCurrency, locale)}
          hint={formatPercent(figures.savingsRate, locale)}
        />
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {t("casaOverview.membersTitle")}
        </h2>
        <div className="flex flex-wrap gap-3">
          {figures.contributionShares.map((share) => (
            <span
              key={share.memberUserId}
              className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              {displayName(share.memberUserId)} · {formatPercent(share.share, locale)}
            </span>
          ))}
        </div>
        <SetIncomeForm cycleId={cycle.id} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FixedBillsPreview cycleId={cycle.id} locale={locale} t={t} />
        <RecentPaymentsPreview cycleId={cycle.id} locale={locale} t={t} />
      </div>
    </div>
  )
}

const FixedBillsPreview = ({
  cycleId,
  locale,
  t,
}: {
  readonly cycleId: string
  readonly locale: ReturnType<typeof useLocale>["locale"]
  readonly t: ReturnType<typeof useTranslate>
}) => {
  const bills = useAtomValue(listBillsAtom(cycleId))
  const list = Result.isSuccess(bills) ? bills.value.slice(0, 5) : []

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {t("casaOverview.fixedBills")}
        </h2>
        <Link
          to="/household/fixed-bills"
          className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {t("casaOverview.viewAllBills")}
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("fixedBills.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((bill) => (
            <li key={bill.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300">{bill.label}</span>
              <span className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    bill.paid
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  {bill.paid ? t("fixedBills.paid") : t("fixedBills.pending")}
                </span>
                <span className="tabular-nums text-slate-900 dark:text-slate-50">
                  {formatMoney(bill.amountMinor, bill.currency, locale)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

const RecentPaymentsPreview = ({
  cycleId,
  locale,
  t,
}: {
  readonly cycleId: string
  readonly locale: ReturnType<typeof useLocale>["locale"]
  readonly t: ReturnType<typeof useTranslate>
}) => {
  const payments = useAtomValue(listPaymentsAtom(cycleId))
  const list = Result.isSuccess(payments) ? payments.value.slice(0, 5) : []

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {t("casaOverview.recentPayments")}
        </h2>
        <Link
          to="/household/payments"
          className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {t("casaOverview.viewAllPayments")}
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("casaOverview.noPayments")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((payment) => (
            <li key={payment.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300">{payment.description}</span>
              <span className="tabular-nums text-slate-900 dark:text-slate-50">
                {formatMoney(payment.amountMinor, payment.currency, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
