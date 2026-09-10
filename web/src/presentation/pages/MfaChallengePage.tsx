import { useAtomRefresh } from "@effect-atom/atom-react"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { meAtom } from "../../data/usecases/auth"
import { mfaVerify } from "../../data/usecases/session"
import { HttpApiError } from "../../infra/http/httpApi"
import { useTranslate } from "../../main/LocaleProvider"
import { AuthCard, AuthLayout } from "../components/AuthLayout"
import { Button } from "../components/Button"
import { ErrorBanner } from "../components/ErrorBanner"
import { OtpInput } from "../components/OtpInput"

export const MfaChallengePage = () => {
  const t = useTranslate()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get("userId") ?? ""
  const refreshSession = useAtomRefresh(meAtom)

  const [code, setCode] = useState("")
  const [rememberDevice, setRememberDevice] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.length !== 6 || userId === "") return
    setLoading(true)
    setError(null)
    const outcome = await mfaVerify({ userId, code, rememberDevice }).then(
      (value) => ({ ok: true as const, value }),
      (cause: unknown) => ({ ok: false as const, cause }),
    )
    setLoading(false)

    if (!outcome.ok) {
      setError(
        outcome.cause instanceof HttpApiError
          ? t("mfaChallenge.errorInvalidCode")
          : t("common.unexpectedError"),
      )
      return
    }

    refreshSession()
    navigate("/household")
  }

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("mfaChallenge.title")}
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("mfaChallenge.subtitle")}
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          {error ? <ErrorBanner message={error} /> : null}
          <OtpInput value={code} onChange={setCode} autoFocus />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            {t("mfaChallenge.remember")}
          </label>
          <Button type="submit" loading={loading} disabled={code.length !== 6}>
            {t("mfaChallenge.submit")}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
