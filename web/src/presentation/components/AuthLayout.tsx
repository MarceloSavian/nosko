import type { ReactNode } from "react"
import { useTranslate } from "../../main/LocaleProvider"
import { LanguageToggle } from "./LanguageToggle"
import { Logo } from "./Logo"

export const AuthLayout = ({ children }: { readonly children: ReactNode }) => {
  const t = useTranslate()
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex h-16 items-center justify-between px-4 sm:px-8">
        <Logo />
        <LanguageToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8">{children}</main>
      <footer className="flex items-center justify-center gap-4 px-4 py-6 text-xs text-slate-500 dark:text-slate-500">
        <span>{t("common.terms")}</span>
        <span>{t("common.privacy")}</span>
        <span>{t("common.support")}</span>
      </footer>
    </div>
  )
}

export const AuthCard = ({ children }: { readonly children: ReactNode }) => (
  <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
    <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-indigo-600" />
    <div className="p-6 sm:p-8">{children}</div>
  </div>
)
