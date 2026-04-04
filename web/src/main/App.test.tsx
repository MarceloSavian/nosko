import { I18nProvider } from '@lingui/react';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '@/presentation/contexts/AuthContext';
import { i18n } from '@/test/i18n';
import { router } from './router';

const createTestRouter = (initialPath: string) => {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  return createRouter({
    routeTree: router.routeTree,
    history: memoryHistory,
  });
};

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('landing route', () => {
    it('should render the landing page at /', async () => {
      const testRouter = createTestRouter('/');
      render(
        <I18nProvider i18n={i18n}>
          <AuthProvider>
            {/* biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register */}
            <RouterProvider router={testRouter as any} />
          </AuthProvider>
        </I18nProvider>,
      );
      expect(await screen.findByText('The New Standard.')).toBeInTheDocument();
    });
  });

  describe('login route', () => {
    it('should render the login page at /login', async () => {
      const testRouter = createTestRouter('/login');
      render(
        <I18nProvider i18n={i18n}>
          <AuthProvider>
            {/* biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register */}
            <RouterProvider router={testRouter as any} />
          </AuthProvider>
        </I18nProvider>,
      );
      expect(await screen.findByText('Welcome back')).toBeInTheDocument();
    });
  });
});
