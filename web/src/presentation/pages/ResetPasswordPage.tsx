import { Result, useAtom } from "@effect-atom/atom-react"
import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { resetPasswordAtom } from "../../data/usecases/auth"
import { useTranslate } from "../../main/LocaleProvider"
import { validate } from "../../validation/validate"
import { compareFields } from "../../validation/validators/compareFields"
import { minLength } from "../../validation/validators/minLength"
import { required } from "../../validation/validators/required"
import { AuthCard, AuthLayout } from "../components/AuthLayout"
import { Button } from "../components/Button"
import { ErrorBanner } from "../components/ErrorBanner"
import { Input } from "../components/Input"

export const ResetPasswordPage = () => {
  const t = useTranslate()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const code = searchParams.get("code") ?? ""

  const [result, resetPassword] = useAtom(resetPasswordAtom, { mode: "promiseExit" })
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true)

  const values = { newPassword, confirmPassword }
  const newPasswordError = validate(newPassword, values, [
    required(t("resetPassword.newPasswordLabel")),
    minLength(8, t("signup.passwordHintLength")),
  ])
  const confirmPasswordError = validate(confirmPassword, values, [
    required(t("resetPassword.confirmPasswordLabel")),
    compareFields("newPassword", t("resetPassword.errorPasswordsDontMatch")),
  ])
  const isFormInvalid = newPasswordError !== null || confirmPasswordError !== null

  const errorMessage = Result.matchWithError(result, {
    onInitial: () => null,
    onSuccess: () => null,
    onError: () => t("resetPassword.errorInvalidCode"),
    onDefect: () => t("common.unexpectedError"),
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isFormInvalid || email === "" || code === "") return
    const exit = await resetPassword({ payload: { email, code, newPassword, revokeOtherSessions } })
    if (exit._tag === "Success") {
      navigate("/login")
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("resetPassword.title")}
        </h1>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
          <Input
            label={t("resetPassword.newPasswordLabel")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={newPassword !== "" ? newPasswordError : null}
          />
          <Input
            label={t("resetPassword.confirmPasswordLabel")}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword !== "" ? confirmPasswordError : null}
          />
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={revokeOtherSessions}
              onChange={(e) => setRevokeOtherSessions(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
            />
            {t("resetPassword.revokeOthers")}
          </label>

          <Button type="submit" loading={Result.isWaiting(result)} disabled={isFormInvalid}>
            {t("resetPassword.submit")}
          </Button>

          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {t("resetPassword.hint")}
          </p>

          <Link
            to="/login"
            className="text-center text-sm font-medium text-emerald-700 dark:text-emerald-400"
          >
            {t("resetPassword.cancel")}
          </Link>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
