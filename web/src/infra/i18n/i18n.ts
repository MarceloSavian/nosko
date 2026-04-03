import { i18n } from '@lingui/core';

const DEFAULT_LOCALE = 'en';

type CatalogModule = { messages: Record<string, string> };

async function loadCatalog(locale: string): Promise<void> {
  const { messages }: CatalogModule = await import(`../../locales/${locale}/messages.js`);
  i18n.load(locale, messages);
}

export async function activateLocale(locale: string): Promise<void> {
  await loadCatalog(locale);
  i18n.activate(locale);
}

export async function initI18n(): Promise<typeof i18n> {
  await activateLocale(DEFAULT_LOCALE);
  return i18n;
}

export { i18n };
