import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithI18n } from '@/test/i18n';
import { EmailVerifiedPage } from './EmailVerifiedPage';

function renderWithRouter(initialPath = '/email-verified') {
  const rootRoute = createRootRoute();
  const emailVerifiedRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/email-verified',
    component: () => <EmailVerifiedPage />,
  });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => <div>Login Page</div>,
  });
  const routeTree = rootRoute.addChildren([emailVerifiedRoute, loginRoute]);
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({ routeTree, history: memoryHistory });
  // biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register
  renderWithI18n(<RouterProvider router={router as any} />);
  return { router };
}

describe('EmailVerifiedPage', () => {
  const makeSut = () => {
    return renderWithRouter();
  };

  describe('render', () => {
    it('should display the verified icon', async () => {
      makeSut();
      const icon = await screen.findByText('verified');
      expect(icon).toBeInTheDocument();
    });

    it('should display the success heading', async () => {
      makeSut();
      expect(await screen.findByText('Email Verified')).toBeInTheDocument();
    });

    it('should display the success message', async () => {
      makeSut();
      expect(
        await screen.findByText(
          'Your email has been successfully confirmed. You can now sign in to your account.',
        ),
      ).toBeInTheDocument();
    });

    it('should display the Go to Login button', async () => {
      makeSut();
      expect(await screen.findByRole('button', { name: 'Go to Login' })).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to /login when clicking Go to Login', async () => {
      const { router } = makeSut();
      const user = userEvent.setup();

      const loginButton = await screen.findByRole('button', { name: 'Go to Login' });
      await user.click(loginButton);

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/login');
      });
    });
  });
});
