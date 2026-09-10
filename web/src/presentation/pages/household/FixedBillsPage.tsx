import { Result, useAtom, useAtomValue } from "@effect-atom/atom-react"
import { useState } from "react"
import {
  createBillAtom,
  listBillsAtom,
  removeBillAtom,
  setBillPaidAtom,
} from "../../../data/usecases/bills"
import { listCategoriesAtom } from "../../../data/usecases/categories"
import { currentCycleAtom } from "../../../data/usecases/cycles"
import { useLocale, useTranslate } from "../../../main/LocaleProvider"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { ErrorBanner } from "../../components/ErrorBanner"
import { formatMoney } from "../../format"

const NewBillForm = ({
  cycleId,
  nextSortOrder,
}: {
  readonly cycleId: string
  readonly nextSortOrder: number
}) => {
  const t = useTranslate()
  const categories = useAtomValue(listCategoriesAtom)
  const categoryList = Result.isSuccess(categories)
    ? categories.value.filter((c) => c.scope === "household")
    : []

  const [label, setLabel] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDay, setDueDay] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [result, createBill] = useAtom(createBillAtom, { mode: "promiseExit" })
  const errorMessage = Result.isFailure(result) ? t("common.unexpectedError") : null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = Number.parseFloat(amount)
    if (label.trim() === "" || !Number.isFinite(parsed)) return
    const exit = await createBill({
      payload: {
        cycleId,
        recurringRuleId: null,
        label,
        amountMinor: Math.round(parsed * 100),
        payingAccountId: null,
        dueDay: dueDay === "" ? null : Number.parseInt(dueDay, 10),
        categoryId: categoryId === "" ? null : categoryId,
        sortOrder: nextSortOrder,
      },
      reactivityKeys: ["bills"],
    })
    if (exit._tag === "Success") {
      setLabel("")
      setAmount("")
      setDueDay("")
      setCategoryId("")
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="flex flex-col gap-4">
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("fixedBills.labelLabel")}
            aria-label={t("fixedBills.labelLabel")}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("fixedBills.amountLabel")}
            aria-label={t("fixedBills.amountLabel")}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            type="number"
            min={1}
            max={28}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder={t("fixedBills.dueDayLabel")}
            aria-label={t("fixedBills.dueDayLabel")}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <Button type="submit" loading={Result.isWaiting(result)}>
          {t("fixedBills.submit")}
        </Button>
      </Card>
    </form>
  )
}

export const FixedBillsPage = () => {
  const t = useTranslate()
  const { locale } = useLocale()
  const cycleResult = useAtomValue(currentCycleAtom)

  if (Result.isInitial(cycleResult)) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t("common.loading")}</p>
  }

  if (!Result.isSuccess(cycleResult) || cycleResult.value === null) {
    return (
      <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
        {t("fixedBills.noCycle")}
      </Card>
    )
  }

  const cycleId = cycleResult.value.cycle.id

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("fixedBills.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("fixedBills.subtitle")}
        </p>
      </div>

      <BillsList cycleId={cycleId} locale={locale} />
    </div>
  )
}

const BillsList = ({
  cycleId,
  locale,
}: {
  readonly cycleId: string
  readonly locale: ReturnType<typeof useLocale>["locale"]
}) => {
  const t = useTranslate()
  const bills = useAtomValue(listBillsAtom(cycleId))
  const [, setPaid] = useAtom(setBillPaidAtom, { mode: "promiseExit" })
  const [, removeBill] = useAtom(removeBillAtom, { mode: "promiseExit" })
  const list = Result.isSuccess(bills) ? bills.value : []

  return (
    <>
      <NewBillForm cycleId={cycleId} nextSortOrder={list.length} />

      {list.length === 0 ? (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
          {t("fixedBills.empty")}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((bill) => (
            <Card key={bill.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPaid({
                      payload: { id: bill.id, paid: !bill.paid, paidOnDay: null },
                      reactivityKeys: ["bills"],
                    })
                  }
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    bill.paid
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  {bill.paid ? t("fixedBills.markUnpaid") : t("fixedBills.markPaid")}
                </button>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {bill.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-sm font-medium text-slate-700 dark:text-slate-300">
                  {formatMoney(bill.amountMinor, bill.currency, locale)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    removeBill({ payload: { id: bill.id }, reactivityKeys: ["bills"] })
                  }
                  className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
                >
                  {t("fixedBills.remove")}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
