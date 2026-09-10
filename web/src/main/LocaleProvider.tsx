import { createContext, type ReactNode, useContext, useState } from "react"
import { type Locale, type TranslationKey, translate } from "../i18n"

const LocaleContext = createContext<{
  readonly locale: Locale
  readonly setLocale: (locale: Locale) => void
} | null>(null)

export const LocaleProvider = ({ children }: { readonly children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>("pt-BR")
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>
}

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (context === null) {
    throw new Error("useLocale must be used within a LocaleProvider")
  }
  return context
}

export const useTranslate = () => {
  const { locale } = useLocale()
  return (key: TranslationKey) => translate(locale, key)
}
