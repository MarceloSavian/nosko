import { useState } from "react"
import { type Locale, translate } from "./i18n"

export const App = () => {
  const [locale, setLocale] = useState<Locale>("pt-BR")
  const next: Locale = locale === "en" ? "pt-BR" : "en"

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">{translate(locale, "appTitle")}</h1>
      <nav className="mt-2 text-gray-600">{translate(locale, "overview")}</nav>
      <button
        type="button"
        className="mt-4 rounded border px-3 py-1"
        onClick={() => setLocale(next)}
      >
        {locale}
      </button>
    </main>
  )
}
