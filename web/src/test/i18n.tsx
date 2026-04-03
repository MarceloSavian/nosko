import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { messages } from '@/locales/en/messages.mjs';

i18n.load('en', messages);
i18n.activate('en');

function I18nWrapper({ children }: { children: ReactNode }) {
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}

export function renderWithI18n(ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: I18nWrapper, ...options });
}

export { i18n };
