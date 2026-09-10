import { useAtomRefresh } from "@effect-atom/atom-react"
import { useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router"
import { meAtom } from "../../../data/usecases/auth"
import { logout } from "../../../data/usecases/session"
import { useSession } from "../../../main/atoms/session"
import { useTranslate } from "../../../main/LocaleProvider"
import { LanguageToggle } from "../../components/LanguageToggle"
import { Logo } from "../../components/Logo"
import { PrivacyChip } from "../../components/PrivacyChip"

type Space = "household" | "personal"

const householdNav = [
  { labelKey: "shell.nav.overview", path: "/household" },
  { labelKey: "shell.nav.sharedAccounts", path: "/household/accounts" },
  { labelKey: "shell.nav.payments", path: "/household/payments" },
  { labelKey: "shell.nav.cycles", path: "/household/cycles" },
  { labelKey: "shell.nav.fixedBills", path: "/household/fixed-bills" },
  { labelKey: "shell.nav.goals", path: "/household/goals" },
  { labelKey: "shell.nav.summary", path: "/household/summary" },
] as const

const personalNav = [
  { labelKey: "shell.nav.overview", path: "/personal" },
  { labelKey: "shell.nav.myAccounts", path: "/personal/accounts" },
  { labelKey: "shell.nav.myPayments", path: "/personal/payments" },
  { labelKey: "shell.nav.savings", path: "/personal/savings" },
  { labelKey: "shell.nav.projection", path: "/personal/projection" },
  { labelKey: "shell.nav.subscriptions", path: "/personal/subscriptions" },
] as const

export const AppShell = () => {
  const t = useTranslate()
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSession()
  const refreshSession = useAtomRefresh(meAtom)
  const [loggingOut, setLoggingOut] = useState(false)

  const space: Space = location.pathname.startsWith("/personal") ? "personal" : "household"
  const nav = space === "household" ? householdNav : personalNav
  const accent = space === "household" ? "emerald" : "indigo"

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    refreshSession()
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="flex w-72 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900">
        <Logo />

        <div className="mt-6 flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
          <Link
            to="/household"
            className={`flex-1 rounded-full py-2 text-center text-sm font-semibold transition-colors ${
              space === "household"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {t("shell.switcher.casa")}
          </Link>
          <Link
            to="/personal"
            className={`flex-1 rounded-full py-2 text-center text-sm font-semibold transition-colors ${
              space === "personal"
                ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {t("shell.switcher.pessoal")}
          </Link>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? accent === "emerald"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            )
          })}
        </nav>

        <div className="mt-4 flex flex-col gap-1 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link
            to="/settings"
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("shell.nav.settings")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("shell.logout")}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {space === "personal" ? <PrivacyChip /> : t("shell.switcher.casa")}
          </span>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            {session.status === "authenticated" ? (
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {session.user.name}
              </span>
            ) : null}
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
