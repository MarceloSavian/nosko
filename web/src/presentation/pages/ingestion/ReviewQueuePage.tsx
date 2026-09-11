import { Result, useAtom, useAtomValue } from "@effect-atom/atom-react"
import type { TransactionView } from "@nosko/contracts"
import { useState } from "react"
import { listCategoriesAtom } from "../../../data/usecases/categories"
import {
  bulkConfirmTransactionsAtom,
  confirmTransactionAtom,
  ignoreTransactionAtom,
  listStagedTransactionsAtom,
} from "../../../data/usecases/ingestion"
import { useLocale, useTranslate } from "../../../main/LocaleProvider"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { formatDate, formatMoney } from "../../format"

const TransactionRow = ({
  transaction,
  categoryOptions,
  selected,
  onToggleSelect,
}: {
  readonly transaction: TransactionView
  readonly categoryOptions: ReadonlyArray<{ readonly id: string; readonly name: string }>
  readonly selected: boolean
  readonly onToggleSelect: () => void
}) => {
  const t = useTranslate()
  const { locale } = useLocale()
  const [categoryId, setCategoryId] = useState(transaction.categoryId ?? "")
  const [confirmResult, confirm] = useAtom(confirmTransactionAtom, { mode: "promiseExit" })
  const [, ignore] = useAtom(ignoreTransactionAtom, { mode: "promiseExit" })

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="mt-1.5"
          aria-label={t("review.select")}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {transaction.description}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                transaction.visibility === "shared"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
              }`}
            >
              {transaction.visibility === "shared"
                ? t("shell.switcher.casa")
                : t("shell.switcher.pessoal")}
            </span>
            {transaction.isTransfer ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {t("review.transfer")}
              </span>
            ) : null}
          </div>
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            {formatDate(transaction.bookedAt, locale)}
            {transaction.counterparty ? ` · ${transaction.counterparty}` : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="tabular-nums text-sm font-medium text-slate-700 dark:text-slate-300">
          {transaction.direction === "credit" ? "+" : "−"}
          {formatMoney(transaction.amountMinor, transaction.currency, locale)}
        </span>
        <select
          aria-label={t("review.categoryLabel")}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">{t("review.categoryLabel")}</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          loading={Result.isWaiting(confirmResult)}
          disabled={categoryId === ""}
          onClick={() =>
            confirm({
              payload: { transactionId: transaction.id, categoryId },
              reactivityKeys: ["transactions", "cycles", "payments"],
            })
          }
        >
          {t("review.confirm")}
        </Button>
        <button
          type="button"
          onClick={() =>
            ignore({
              payload: { transactionId: transaction.id },
              reactivityKeys: ["transactions"],
            })
          }
          className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
        >
          {t("review.ignore")}
        </button>
      </div>
    </Card>
  )
}

export const ReviewQueuePage = () => {
  const t = useTranslate()
  const staged = useAtomValue(listStagedTransactionsAtom)
  const categories = useAtomValue(listCategoriesAtom)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [bulkCategoryId, setBulkCategoryId] = useState("")
  const [bulkResult, bulkConfirm] = useAtom(bulkConfirmTransactionsAtom, { mode: "promiseExit" })

  const list = Result.isSuccess(staged) ? staged.value : []
  const categoryList = Result.isSuccess(categories) ? categories.value : []

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkConfirm = async () => {
    if (selected.size === 0 || bulkCategoryId === "") return
    const exit = await bulkConfirm({
      payload: { transactionIds: [...selected], categoryId: bulkCategoryId },
      reactivityKeys: ["transactions", "cycles", "payments"],
    })
    if (exit._tag === "Success") {
      setSelected(new Set())
      setBulkCategoryId("")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("review.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("review.subtitle")}</p>
      </div>

      {list.length === 0 ? (
        <Card className="text-center text-sm text-slate-500 dark:text-slate-400">
          {t("review.empty")}
        </Card>
      ) : (
        <>
          {selected.size > 0 ? (
            <Card className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {t("review.selectedCount")}: {selected.size}
              </span>
              <select
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">{t("review.categoryLabel")}</option>
                {categoryList.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                loading={Result.isWaiting(bulkResult)}
                disabled={bulkCategoryId === ""}
                onClick={handleBulkConfirm}
              >
                {t("review.bulkConfirm")}
              </Button>
            </Card>
          ) : null}

          <div className="flex flex-col gap-3">
            {list.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                categoryOptions={categoryList.filter(
                  (c) =>
                    c.scope === (transaction.visibility === "shared" ? "household" : "personal"),
                )}
                selected={selected.has(transaction.id)}
                onToggleSelect={() => toggleSelect(transaction.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
