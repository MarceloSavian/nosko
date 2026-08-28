export const locales = ["en", "pt-BR"] as const
export type Locale = (typeof locales)[number]

export const dictionaries = {
  en: {
    appTitle: "finance-app",
    overview: "Overview",
  },
  "pt-BR": {
    appTitle: "finance-app",
    overview: "Visão geral",
  },
} as const

export type TranslationKey = keyof (typeof dictionaries)["en"]

export const translate = (locale: Locale, key: TranslationKey): string => dictionaries[locale][key]
