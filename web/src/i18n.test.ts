import { dictionaries, locales, translate } from "./i18n"

describe("i18n", () => {
  it("defines the same keys in every locale", () => {
    const enKeys = Object.keys(dictionaries.en).sort()
    for (const locale of locales) {
      expect(Object.keys(dictionaries[locale]).sort()).toEqual(enKeys)
    }
  })

  it("translates a key per locale", () => {
    expect(translate("en", "app.title")).toBe("nosko")
    expect(translate("pt-BR", "login.submit")).toBe("Entrar no nosko")
  })
})
