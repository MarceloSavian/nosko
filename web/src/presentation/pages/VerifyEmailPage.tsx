import { Result, useAtom } from "@effect-atom/atom-react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { resendVerificationAtom, verifyEmailAtom } from "../../data/usecases/auth"
import { useTranslate } from "../../main/LocaleProvider"
import { AuthCard, AuthLayout } from "../components/AuthLayout"
import { Button } from "../components/Button"
import { ErrorBanner } from "../components/ErrorBanner"
import { OtpInput } from "../components/OtpInput"

const RESEND_COOLDOWN_SECONDS = 48

export const VerifyEmailPage = () => {
  const t = useTranslate()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get("userId") ?? ""

  const [code, setCode] = useState("")
  const [result, verifyEmail] = useAtom(verifyEmailAtom, { mode: "promiseExit" })
  const [resendResult, resendVerification] = useAtom(resendVerificationAtom, {
    mode: "promiseExit",
  })
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown === 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const errorMessage = Result.matchWithError(result, {
    onInitial: () => null,
    onSuccess: () => null,
    onError: () => t("verifyEmail.errorInvalidCode"),
    onDefect: () => t("common.unexpectedError"),
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.length !== 6 || userId === "") return
    const exit = await verifyEmail({ payload: { userId, code } })
    if (exit._tag === "Success") {
      // Verifying doesn't create a session (only login/mfaVerify/refresh write cookies), so the
      // user goes back to sign in, and the auth guards take them the rest of the way from there.
      navigate("/login?verified=1")
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || userId === "") return
    await resendVerification({ payload: { userId } })
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("verifyEmail.title")}
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("verifyEmail.subtitle")}
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
          <OtpInput value={code} onChange={setCode} autoFocus />
          <Button type="submit" loading={Result.isWaiting(result)} disabled={code.length !== 6}>
            {t("verifyEmail.submit")}
          </Button>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t("verifyEmail.resendPrefix")}{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || Result.isWaiting(resendResult)}
              className="font-medium text-emerald-700 disabled:text-slate-400 dark:text-emerald-400 dark:disabled:text-slate-600"
            >
              {t("verifyEmail.resend")}
              {cooldown > 0 ? ` (${cooldown}s)` : ""}
            </button>
          </p>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            {t("verifyEmail.spamHint")}
          </p>
          <Link
            to="/login"
            className="text-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
          >
            {t("verifyEmail.backToLogin")}
          </Link>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
