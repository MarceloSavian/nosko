import { Result, useAtom } from "@effect-atom/atom-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { signUpAtom } from "../../data/usecases/auth"
import { useLocale, useTranslate } from "../../main/LocaleProvider"
import { validate } from "../../validation/validate"
import { compareFields } from "../../validation/validators/compareFields"
import { email as emailRule } from "../../validation/validators/email"
import { minLength } from "../../validation/validators/minLength"
import { required } from "../../validation/validators/required"
import { AuthCard, AuthLayout } from "../components/AuthLayout"
import { Button } from "../components/Button"
import { ErrorBanner } from "../components/ErrorBanner"
import { Input } from "../components/Input"

export const SignUpPage = () => {
  const t = useTranslate()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const [result, signUp] = useAtom(signUpAtom, { mode: "promiseExit" })

  const [name, setName] = useState("")
  const [emailValue, setEmailValue] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const values = { name, email: emailValue, password, confirmPassword }
  const nameError = validate(name, values, [required(t("signup.nameLabel"))])
  const emailError = validate(emailValue, values, [
    required(t("signup.emailLabel")),
    emailRule(t("signup.emailLabel")),
  ])
  const passwordError = validate(password, values, [
    required(t("signup.passwordLabel")),
    minLength(8, t("signup.passwordHintLength")),
  ])
  const confirmPasswordError = validate(confirmPassword, values, [
    required(t("signup.confirmPasswordLabel")),
    compareFields("password", t("signup.errorPasswordsDontMatch")),
  ])
  const isFormInvalid =
    nameError !== null ||
    emailError !== null ||
    passwordError !== null ||
    confirmPasswordError !== null

  const errorMessage = Result.matchWithError(result, {
    onInitial: () => null,
    onSuccess: () => null,
    onError: (error) =>
      error._tag === "EmailAlreadyRegistered"
        ? t("signup.errorEmailInUse")
        : t("common.unexpectedError"),
    onDefect: () => t("common.unexpectedError"),
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isFormInvalid) return
    const exit = await signUp({
      payload: { name, email: emailValue, password, preferredLocale: locale },
    })
    if (exit._tag === "Success") {
      navigate(`/verify-email?userId=${exit.value.id}`)
    }
  }

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t("signup.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("signup.subtitle")}</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
          <Input
            label={t("signup.nameLabel")}
            placeholder={t("signup.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={name !== "" ? nameError : null}
          />
          <Input
            label={t("signup.emailLabel")}
            type="email"
            placeholder={t("signup.emailPlaceholder")}
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            error={emailValue !== "" ? emailError : null}
          />
          <Input
            label={t("signup.passwordLabel")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={password !== "" ? passwordError : null}
          />
          <Input
            label={t("signup.confirmPasswordLabel")}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword !== "" ? confirmPasswordError : null}
          />

          <Button type="submit" loading={Result.isWaiting(result)} disabled={isFormInvalid}>
            {t("signup.submit")}
          </Button>

          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {t("signup.inviteInfo")}
          </p>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            {t("signup.haveAccount")}{" "}
            <Link to="/login" className="font-medium text-emerald-700 dark:text-emerald-400">
              {t("signup.loginLink")}
            </Link>
          </p>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            {t("signup.consent")}
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}
