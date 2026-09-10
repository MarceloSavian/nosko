import { useAtomRefresh } from "@effect-atom/atom-react"
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { meAtom } from "../../data/usecases/auth"
import { login } from "../../data/usecases/session"
import { HttpApiError } from "../../infra/http/httpApi"
import { useTranslate } from "../../main/LocaleProvider"
import { AuthCard, AuthLayout } from "../components/AuthLayout"
import { Button } from "../components/Button"
import { ErrorBanner } from "../components/ErrorBanner"
import { Input } from "../components/Input"

export const LoginPage = () => {
  const t = useTranslate()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const refreshSession = useAtomRefresh(meAtom)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const outcome = await login({ email, password }).then(
      (value) => ({ ok: true as const, value }),
      (cause: unknown) => ({ ok: false as const, cause }),
    )
    setLoading(false)

    if (!outcome.ok) {
      if (outcome.cause instanceof HttpApiError) {
        const tag = (outcome.cause.body as { readonly _tag?: string } | undefined)?._tag
        setError(
          tag === "EmailNotVerified"
            ? t("login.errorEmailNotVerified")
            : t("login.errorInvalidCredentials"),
        )
      } else {
        setError(t("common.unexpectedError"))
      }
      return
    }

    refreshSession()
    if (outcome.value.status === "mfa_required") {
      navigate(`/mfa?userId=${outcome.value.userId}`)
    } else {
      navigate("/household")
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t("login.title")}</h1>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          {searchParams.get("verified") === "1" ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
              {t("verifyEmail.success")}
            </p>
          ) : null}
          {error ? <ErrorBanner message={error} /> : null}
          <Input
            label={t("login.emailLabel")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <Input
              label={t("login.passwordLabel")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Link
              to="/forgot-password"
              className="self-end text-sm text-emerald-700 dark:text-emerald-400"
            >
              {t("login.forgotPassword")}
            </Link>
          </div>
          <Button type="submit" loading={loading}>
            {t("login.submit")}
          </Button>

          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {t("login.mfaInfo")}
          </p>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t("login.newHere")}
            <br />
            <Link to="/signup" className="font-medium text-emerald-700 dark:text-emerald-400">
              {t("login.signupLink")}
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
