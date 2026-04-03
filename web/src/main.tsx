import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/presentation/styles/global.css';
import { App } from '@/main/App';

// biome-ignore lint/style/noNonNullAssertion: root element always exists in index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
