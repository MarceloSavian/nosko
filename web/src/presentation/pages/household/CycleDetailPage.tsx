import { Result, useAtom, useAtomRefresh, useAtomValue } from "@effect-atom/atom-react"
import type { TransferDirection } from "@nosko/contracts"
import { useState } from "react"
import { useNavigate, useParams } from "react-router"
import {
  closeCycleAtom,
  cycleAtom,
  recordTransferAtom,
  settleTransferAtom,
} from "../../../data/usecases/cycles"
import { listMembersAtom } from "../../../data/usecases/household"
import { useHousehold } from "../../../main/atoms/household"
import { useLocale, useTranslate } from "../../../main/LocaleProvider"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { formatMoney, formatPercent } from "../../format"

const FigureRow = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <div className="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-b-0 dark:border-slate-800">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-medium tabular-nums text-slate-900 dark:text-slate-50">{value}</span>
  </div>
)

const RecordTransferForm = ({
  cycleId,
  onRecorded,
}: {
  readonly cycleId: string
  readonly onRecorded: () => void
}) => {
  const t = useTranslate()
  const members = useAtomValue(listMembersAtom)
  const [memberUserId, setMemberUserId] = useState("")
  const [direction, setDirection] = useState<TransferDirection>("to_household")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("")
  const [result, recordTransfer] = useAtom(recordTransferAtom, { mode: "promiseExit" })

  const memberList = Result.isSuccess(members) ? members.value : []

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = Number.parseFloat(amount)
    if (memberUserId === "" || !Number.isFinite(parsed)) return
    const exit = await recordTransfer({
      payload: {
        cycleId,
        memberUserId,
        direction,
        amountMinor: Math.round(parsed * 100),
        method: method.trim() === "" ? null : method,
      },
      reactivityKeys: ["cycles"],
    })
    if (exit._tag === "Success") {
      setAmount("")
      setMethod("")
      onRecorded()
    }
  }

  if (memberList.length === 0) return null

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <select
        aria-label={t("cycleDetail.transfersTitle")}
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
      <select
        aria-label={t("cycleDetail.transferDirection.toHousehold")}
        value={direction}
        onChange={(e) => setDirection(e.target.value as TransferDirection)}
        className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="to_household">{t("cycleDetail.transferDirection.toHousehold")}</option>
        <option value="to_personal">{t("cycleDetail.transferDirection.toPersonal")}</option>
      </select>
      <input
        type="number"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={t("cycleDetail.transferAmountLabel")}
        aria-label={t("cycleDetail.transferAmountLabel")}
        className="w-32 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      <input
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        placeholder={t("cycleDetail.transferMethodLabel")}
        aria-label={t("cycleDetail.transferMethodLabel")}
        className="w-40 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      <Button type="submit" loading={Result.isWaiting(result)}>
        {t("cycleDetail.recordTransfer")}
      </Button>
    </form>
  )
}

export const CycleDetailPage = () => {
  const t = useTranslate()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const id = params.id ?? ""
  const detailResult = useAtomValue(cycleAtom(id))
  const refreshCycle = useAtomRefresh(cycleAtom(id))
  const household = useHousehold()
  const members = useAtomValue(listMembersAtom)
  const [closeResult, closeCycle] = useAtom(closeCycleAtom, { mode: "promiseExit" })
  const [, settleTransfer] = useAtom(settleTransferAtom, { mode: "promiseExit" })

  if (Result.isInitial(detailResult)) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t("common.loading")}</p>
  }
  if (!Result.isSuccess(detailResult)) {
    return null
  }

  const { cycle, figures, transfers } = detailResult.value
  const baseCurrency = household.status === "present" ? household.household.baseCurrency : "EUR"
  const memberList = Result.isSuccess(members) ? members.value : []
  const displayName = (userId: string) =>
    memberList.find((m) => m.userId === userId)?.displayName ?? userId
  const money = (minor: number) => formatMoney(minor, baseCurrency, locale)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate("/household/cycles")}
            className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            ← {t("cycleDetail.back")}
          </button>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
            {cycle.title ?? cycle.cycleKey}
          </h1>
        </div>
        {cycle.status === "open" ? (
          <Button
            type="button"
            variant="secondary"
            loading={Result.isWaiting(closeResult)}
            onClick={async () => {
              await closeCycle({ payload: { id: cycle.id }, reactivityKeys: ["cycles"] })
              refreshCycle()
            }}
          >
            {t("cycleDetail.close")}
          </Button>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {t("cycleDetail.closed")}
          </span>
        )}
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {t("cycleDetail.figuresTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          <div>
            <FigureRow label={t("cycleDetail.income")} value={money(figures.income)} />
            <FigureRow label={t("cycleDetail.fixedTotal")} value={money(figures.fixedTotal)} />
            <FigureRow label={t("cycleDetail.estimate")} value={money(figures.estimate)} />
            <FigureRow label={t("cycleDetail.reserve")} value={money(figures.reserve)} />
            <FigureRow
              label={t("cycleDetail.openingBalance")}
              value={money(figures.openingBalance)}
            />
            <FigureRow
              label={t("cycleDetail.availableAfterPayments")}
              value={money(figures.availableAfterPayments)}
            />
          </div>
          <div>
            <FigureRow
              label={t("cycleDetail.withdrawalTotal")}
              value={money(figures.withdrawalTotal)}
            />
            <FigureRow label={t("cycleDetail.available")} value={money(figures.available)} />
            <FigureRow
              label={t("cycleDetail.variableTotal")}
              value={money(figures.variableTotal)}
            />
            <FigureRow label={t("cycleDetail.totalSpent")} value={money(figures.totalSpent)} />
            <FigureRow label={t("cycleDetail.surplus")} value={money(figures.surplus)} />
            <FigureRow
              label={t("cycleDetail.dailyAllowance")}
              value={money(figures.dailyAllowance)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          {figures.contributionShares.map((share) => (
            <span
              key={share.memberUserId}
              className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              {displayName(share.memberUserId)} · {formatPercent(share.share, locale)}
            </span>
          ))}
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {t("cycleDetail.savingsRate")}: {formatPercent(figures.savingsRate, locale)}
          </span>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {t("cycleDetail.transfersTitle")}
        </h2>
        <RecordTransferForm cycleId={cycle.id} onRecorded={refreshCycle} />
        {transfers.length === 0 ? null : (
          <ul className="flex flex-col gap-2">
            {transfers.map((transfer) => (
              <li key={transfer.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">
                  {displayName(transfer.memberUserId)} ·{" "}
                  {transfer.direction === "to_household"
                    ? t("cycleDetail.transferDirection.toHousehold")
                    : t("cycleDetail.transferDirection.toPersonal")}
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-slate-900 dark:text-slate-50">
                    {formatMoney(transfer.amountMinor, transfer.currency, locale)}
                  </span>
                  {transfer.settledAt === null ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await settleTransfer({
                          payload: { transferId: transfer.id },
                          reactivityKeys: ["cycles"],
                        })
                        refreshCycle()
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      {t("cycleDetail.settle")}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">
                      {t("cycleDetail.settled")}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
