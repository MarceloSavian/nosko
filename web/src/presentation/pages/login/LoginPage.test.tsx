import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
  UnexpectedError,
} from '@/domain/errors/auth';
import type { ILogin } from '@/domain/usecases/auth/ILogin';
import { AuthProvider } from '@/presentation/contexts/AuthContext';
import { renderWithI18n } from '@/test/i18n';
import { LoginPage } from './LoginPage';

const loginResult = { accessToken: 'jwt-token' };

function renderWithRouter(loginSpy: ILogin, initialPath = '/login') {
  const rootRoute = createRootRoute();
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => <LoginPage loginUseCase={loginSpy} />,
  });
  const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/dashboard',
    component: () => <div>Dashboard Page</div>,
  });
  const confirmEmailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/confirm-email',
    component: () => <div>Confirm Email Page</div>,
  });
  const signupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/signup',
    component: () => <div>Signup Page</div>,
  });
  const routeTree = rootRoute.addChildren([
    loginRoute,
    dashboardRoute,
    confirmEmailRoute,
    signupRoute,
  ]);
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({ routeTree, history: memoryHistory });
  // biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register
  renderWithI18n(
    <AuthProvider>
      <RouterProvider router={router as any} />
    </AuthProvider>,
  );
  return { router };
}

function getSubmitButton() {
  return screen.getByRole('button', { name: /Sign In/i });
}

describe('LoginPage', () => {
  const makeSut = () => {
    localStorage.clear();
    const loginSpy: ILogin = { execute: vi.fn() };
    renderWithRouter(loginSpy);
    return { loginSpy };
  };

  describe('render', () => {
    it('should display the login form heading', async () => {
      makeSut();
      expect(await screen.findByText('Welcome back')).toBeInTheDocument();
    });

    it('should display email and password fields', async () => {
      makeSut();
      expect(await screen.findByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should display the submit button', async () => {
      makeSut();
      const submitButton = await screen.findByText('Sign In');
      expect(submitButton.closest('button')).toBeInTheDocument();
    });

    it('should display link to signup page', async () => {
      makeSut();
      expect(await screen.findByText('Create an account')).toBeInTheDocument();
    });
  });

  describe('password visibility toggle', () => {
    it('should toggle password field type when clicking visibility button', async () => {
      makeSut();
      const user = userEvent.setup();

      const passwordInput = await screen.findByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      const visibilityButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.querySelector('.material-symbols-outlined'));
      const toggleBtn = visibilityButtons.find(
        (btn) =>
          btn.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'visibility',
      );
      if (toggleBtn) await user.click(toggleBtn);

      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('validation', () => {
    it('should show validation error for invalid email', async () => {
      const { loginSpy } = makeSut();
      const user = userEvent.setup();

      await screen.findByLabelText('Email Address');
      await user.type(screen.getByLabelText('Email Address'), 'invalid-email');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });
      expect(loginSpy.execute).not.toHaveBeenCalled();
    });

    it('should show validation error when password is empty', async () => {
      const { loginSpy } = makeSut();
      const user = userEvent.setup();

      await screen.findByLabelText('Email Address');
      await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
      await user.click(getSubmitButton());

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
      expect(loginSpy.execute).not.toHaveBeenCalled();
    });
  });

  describe('submission', () => {
    const fillAndSubmitForm = async () => {
      const user = userEvent.setup();
      await screen.findByLabelText('Email Address');
      await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(getSubmitButton());
    };

    it('should call loginUseCase.execute with form data', async () => {
      const { loginSpy } = makeSut();
      vi.spyOn(loginSpy, 'execute').mockResolvedValueOnce(loginResult);

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(loginSpy.execute).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should navigate to /dashboard on successful login', async () => {
      const loginSpy: ILogin = { execute: vi.fn() };
      localStorage.clear();
      vi.spyOn(loginSpy, 'execute').mockResolvedValueOnce(loginResult);
      renderWithRouter(loginSpy);

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      });
    });

    it('should show error message for invalid credentials', async () => {
      const { loginSpy } = makeSut();
      vi.spyOn(loginSpy, 'execute').mockRejectedValueOnce(new InvalidCredentialsError());

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });
    });

    it('should navigate to /confirm-email when email is not verified', async () => {
      const loginSpy: ILogin = { execute: vi.fn() };
      localStorage.clear();
      vi.spyOn(loginSpy, 'execute').mockRejectedValueOnce(new EmailNotVerifiedError());
      renderWithRouter(loginSpy);

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('Confirm Email Page')).toBeInTheDocument();
      });
    });

    it('should show generic error message on unexpected error', async () => {
      const { loginSpy } = makeSut();
      vi.spyOn(loginSpy, 'execute').mockRejectedValueOnce(new UnexpectedError());

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
      });
    });

    it('should disable submit button while submitting', async () => {
      const { loginSpy } = makeSut();
      let resolveLogin: (value: typeof loginResult) => void;
      vi.spyOn(loginSpy, 'execute').mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          }),
      );

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Signing in/i })).toBeDisabled();
      });

      resolveLogin!(loginResult);
    });
  });
});
