import { useLocale } from "../../main/LocaleProvider"

export const LanguageToggle = () => {
  const { locale, setLocale } = useLocale()
  return (
    <div className="flex rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800">
      {(["pt-BR", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === option
              ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-400"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {option === "pt-BR" ? "PT" : "EN"}
        </button>
      ))}
    </div>
  )
}
