import { Result, useAtom } from "@effect-atom/atom-react"
import { useEffect, useState } from "react"
import { Link } from "react-router"
import { requestPasswordResetAtom } from "../../data/usecases/auth"
import { useTranslate } from "../../main/LocaleProvider"
import { AuthCard, AuthLayout } from "../components/AuthLayout"
import { Button } from "../components/Button"
import { Input } from "../components/Input"

const RESEND_COOLDOWN_SECONDS = 45

export const ForgotPasswordPage = () => {
  const t = useTranslate()
  const [email, setEmail] = useState("")
  const [result, requestPasswordReset] = useAtom(requestPasswordResetAtom, { mode: "promiseExit" })
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown === 0) return
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const sent = Result.isSuccess(result)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (cooldown > 0 || email === "") return
    await requestPasswordReset({ payload: { email } })
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("forgotPassword.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("forgotPassword.subtitle")}
        </p>

        {sent ? (
          <div className="mt-6 flex flex-col gap-3">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
              <strong className="block">{t("forgotPassword.sentTitle")}</strong>
              {t("forgotPassword.sentBody")}
            </p>
            <button
              type="button"
              onClick={() => setCooldown(RESEND_COOLDOWN_SECONDS)}
              disabled={cooldown > 0}
              className="text-sm font-medium text-emerald-700 disabled:text-slate-400 dark:text-emerald-400 dark:disabled:text-slate-600"
            >
              {t("forgotPassword.resendIn")} {cooldown > 0 ? `${cooldown}s` : ""}
            </button>
          </div>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label={t("forgotPassword.emailLabel")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" loading={Result.isWaiting(result)}>
              {t("forgotPassword.submit")}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link to="/login" className="font-medium text-emerald-700 dark:text-emerald-400">
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          {t("forgotPassword.noAccount")}{" "}
          <Link to="/signup" className="font-medium text-emerald-700 dark:text-emerald-400">
            {t("forgotPassword.signupLink")}
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
