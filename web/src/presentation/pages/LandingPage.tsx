import { Link } from "react-router"
import { useTranslate } from "../../main/LocaleProvider"
import { Card } from "../components/Card"
import { LanguageToggle } from "../components/LanguageToggle"
import { Logo } from "../components/Logo"

export const LandingPage = () => {
  const t = useTranslate()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex dark:text-slate-300">
          <span>{t("landing.nav.home")}</span>
          <span>{t("landing.nav.manifesto")}</span>
          <span>{t("landing.nav.security")}</span>
        </nav>
        <LanguageToggle />
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-8 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            {t("landing.hero.title")}
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            {t("landing.hero.subtitle")}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {t("landing.feature.personal.title")}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("landing.feature.personal.body")}
              </p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {t("landing.feature.shared.title")}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("landing.feature.shared.body")}
              </p>
            </Card>
            <Card className="p-4">
              <h2 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {t("landing.feature.budget.title")}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("landing.feature.budget.body")}
              </p>
            </Card>
          </div>
        </div>

        <Card className="rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {t("landing.card.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("landing.card.subtitle")}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-700"
            >
              {t("landing.card.login")}
            </Link>
            <Link
              to="/signup"
              className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {t("landing.card.signup")}
            </Link>
          </div>
        </Card>
      </main>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        <Card className="rounded-3xl bg-gradient-to-r from-emerald-50 to-indigo-50 p-6 dark:from-emerald-950/40 dark:to-indigo-950/40">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {t("landing.banner.title")}
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t("landing.banner.body")}
          </p>
        </Card>
      </div>
    </div>
  )
}
