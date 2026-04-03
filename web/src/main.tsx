import { I18nProvider } from '@lingui/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/presentation/styles/global.css';
import { initI18n } from '@/infra/i18n/i18n';
import { App } from '@/main/App';

initI18n().then((i18n) => {
  // biome-ignore lint/style/noNonNullAssertion: root element always exists in index.html
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider i18n={i18n}>
        <App />
      </I18nProvider>
    </StrictMode>,
  );
});
