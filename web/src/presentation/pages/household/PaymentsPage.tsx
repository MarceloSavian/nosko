import { Result, useAtom, useAtomValue } from "@effect-atom/atom-react"
import { DateTime } from "effect"
import { useState } from "react"
import { listAccountsAtom } from "../../../data/usecases/accounts"
import { listCategoriesAtom } from "../../../data/usecases/categories"
import { currentCycleAtom } from "../../../data/usecases/cycles"
import {
  createPaymentAtom,
  listPaymentsAtom,
  paymentsSummaryAtom,
  removePaymentAtom,
} from "../../../data/usecases/payments"
import { useHousehold } from "../../../main/atoms/household"
import { useLocale, useTranslate } from "../../../main/LocaleProvider"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { ErrorBanner } from "../../components/ErrorBanner"
import { formatMoney } from "../../format"

const todayIsoDate = () => new Date().toISOString().slice(0, 10)

const NewPaymentForm = () => {
  const t = useTranslate()
  const accounts = useAtomValue(listAccountsAtom("shared"))
  const categories = useAtomValue(listCategoriesAtom)
  const household = useHousehold()
  const baseCurrency = household.status === "present" ? household.household.baseCurrency : "EUR"

  const accountList = Result.isSuccess(accounts) ? accounts.value : []
  const categoryList = Result.isSuccess(categories)
    ? categories.value.filter((c) => c.scope === "household")
    : []

  const [accountId, setAccountId] = useState("")
  const [description, setDescription] = useState("")
  const [counterparty, setCounterparty] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [bookedAt, setBookedAt] = useState(todayIsoDate())
  const [result, createPayment] = useAtom(createPaymentAtom, { mode: "promiseExit" })
  const errorMessage = Result.isFailure(result) ? t("common.unexpectedError") : null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = Number.parseFloat(amount)
    if (
      accountId === "" ||
      categoryId === "" ||
      description.trim() === "" ||
      !Number.isFinite(parsed)
    ) {
      return
    }
    const exit = await createPayment({
      payload: {
        accountId,
        bookedAt: DateTime.unsafeFromDate(new Date(bookedAt)),
        description,
        counterparty: counterparty.trim() === "" ? null : counterparty,
        amountMinor: Math.round(parsed * 100),
        currency: baseCurrency,
        categoryId,
      },
      reactivityKeys: ["payments", "cycles"],
    })
    if (exit._tag === "Success") {
      setDescription("")
      setCounterparty("")
      setAmount("")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="flex flex-col gap-4">
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            aria-label={t("payments.accountLabel")}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">{t("payments.accountLabel")}</option>
            {accountList.map((account) => (
              <option key={account.id} value={account.id}>
                {account.nickname}
              </option>
            ))}
          </select>
          <select
            aria-label={t("payments.categoryLabel")}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">{t("payments.categoryLabel")}</option>
            {categoryList.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("payments.descriptionLabel")}
          aria-label={t("payments.descriptionLabel")}
          className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <input
          value={counterparty}
          onChange={(e) => setCounterparty(e.target.value)}
          placeholder={t("payments.counterpartyLabel")}
          aria-label={t("payments.counterpartyLabel")}
          className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("payments.amountLabel")}
            aria-label={t("payments.amountLabel")}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            type="date"
            aria-label={t("payments.dateLabel")}
            value={bookedAt}
            onChange={(e) => setBookedAt(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <Button type="submit" loading={Result.isWaiting(result)}>
          {t("payments.submit")}
        </Button>
      </Card>
    </form>
  )
}

export const PaymentsPage = () => {
  const t = useTranslate()
  const { locale } = useLocale()
  const cycleResult = useAtomValue(currentCycleAtom)

  if (Result.isInitial(cycleResult)) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t("common.loading")}</p>
  }

  if (!Result.isSuccess(cycleResult) || cycleResult.value === null) {
    return (
      <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
        {t("payments.noCycle")}
      </Card>
    )
  }

  const cycleId = cycleResult.value.cycle.id

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("payments.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("payments.subtitle")}</p>
      </div>

      <NewPaymentForm />
      <PaymentsSummary cycleId={cycleId} locale={locale} />
      <PaymentsList cycleId={cycleId} locale={locale} />
    </div>
  )
}

const PaymentsSummary = ({
  cycleId,
  locale,
}: {
  readonly cycleId: string
  readonly locale: ReturnType<typeof useLocale>["locale"]
}) => {
  const t = useTranslate()
  const summary = useAtomValue(paymentsSummaryAtom(cycleId))
  const household = useHousehold()
  if (!Result.isSuccess(summary)) return null
  const { cycleTotalMinor, estimateMinor, averagePerDayMinor } = summary.value
  const currency = household.status === "present" ? household.household.baseCurrency : "EUR"

  return (
    <Card className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("payments.cycleTotal")}
        </span>
        <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
          {formatMoney(cycleTotalMinor, currency, locale)}
        </span>
      </div>
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("payments.estimate")}
        </span>
        <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
          {formatMoney(estimateMinor, currency, locale)}
        </span>
      </div>
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t("payments.averagePerDay")}
        </span>
        <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
          {formatMoney(averagePerDayMinor, currency, locale)}
        </span>
      </div>
    </Card>
  )
}

const PaymentsList = ({
  cycleId,
  locale,
}: {
  readonly cycleId: string
  readonly locale: ReturnType<typeof useLocale>["locale"]
}) => {
  const t = useTranslate()
  const payments = useAtomValue(listPaymentsAtom(cycleId))
  const [, removePayment] = useAtom(removePaymentAtom, { mode: "promiseExit" })
  const list = Result.isSuccess(payments) ? payments.value : []

  if (list.length === 0) {
    return (
      <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
        {t("payments.empty")}
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {list.map((payment) => (
        <Card key={payment.id} className="flex items-center justify-between p-4">
          <div>
            <span className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
              {payment.description}
            </span>
            {payment.counterparty !== null ? (
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {payment.counterparty}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="tabular-nums text-sm font-medium text-slate-700 dark:text-slate-300">
              {formatMoney(payment.amountMinor, payment.currency, locale)}
            </span>
            <button
              type="button"
              onClick={() =>
                removePayment({
                  payload: { id: payment.id },
                  reactivityKeys: ["payments", "cycles"],
                })
              }
              className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
            >
              {t("payments.remove")}
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}
