import { Result, useAtom, useAtomValue } from "@effect-atom/atom-react"
import { useState } from "react"
import { Link } from "react-router"
import { listAccountsAtom } from "../../../data/usecases/accounts"
import { listBanksAtom, uploadStatementAtom } from "../../../data/usecases/ingestion"
import { useTranslate } from "../../../main/LocaleProvider"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { ErrorBanner } from "../../components/ErrorBanner"

export const ImportPage = () => {
  const t = useTranslate()
  const personal = useAtomValue(listAccountsAtom("personal"))
  const shared = useAtomValue(listAccountsAtom("shared"))
  const banks = useAtomValue(listBanksAtom)
  const [accountId, setAccountId] = useState("")
  const [fileName, setFileName] = useState("")
  const [fileContent, setFileContent] = useState("")
  const [result, upload] = useAtom(uploadStatementAtom, { mode: "promiseExit" })

  const accounts = [
    ...(Result.isSuccess(personal) ? personal.value : []),
    ...(Result.isSuccess(shared) ? shared.value : []),
  ]
  const bankList = Result.isSuccess(banks) ? banks.value : []
  const selectedAccount = accounts.find((a) => a.id === accountId)
  const selectedBank = selectedAccount
    ? bankList.find((b) => b.code === selectedAccount.institution)
    : undefined
  const isSupported = selectedBank?.supportsCsv === true

  const errorMessage = Result.isFailure(result) ? t("common.unexpectedError") : null
  const success = Result.isSuccess(result) ? result.value : null

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setFileContent(await file.text())
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (accountId === "" || fileContent === "") return
    await upload({
      payload: { accountId, originalFilename: fileName, fileContent },
      reactivityKeys: ["transactions", "cycles"],
    })
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("import.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("import.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="flex flex-col gap-4">
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("import.accountLabel")}
            </span>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">—</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nickname}
                </option>
              ))}
            </select>
          </div>

          {selectedAccount && !isSupported ? (
            <ErrorBanner message={t("import.unsupportedBank")} />
          ) : null}

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("import.fileLabel")}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={!isSupported}
              className="text-sm text-slate-700 dark:text-slate-300"
            />
          </div>

          <Button
            type="submit"
            disabled={!isSupported || fileContent === ""}
            loading={Result.isWaiting(result)}
          >
            {t("import.submit")}
          </Button>

          {success ? (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              <p>
                {t("import.resultNew")}: {success.newCount} · {t("import.resultDuplicates")}:{" "}
                {success.duplicateCount} · {t("import.resultTransfers")}:{" "}
                {success.transferPairCount}
              </p>
              <Link
                to="/review"
                className="mt-2 inline-block font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
              >
                {t("import.goToReview")}
              </Link>
            </div>
          ) : null}
        </Card>
      </form>
    </div>
  )
}
