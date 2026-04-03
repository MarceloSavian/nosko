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
import { EmailAlreadyRegisteredError, UnexpectedError } from '@/domain/errors/auth';
import type { ISignUp } from '@/domain/usecases/auth/ISignUp';
import { renderWithI18n } from '@/test/i18n';
import { SignUpPage } from './SignUpPage';

const signupResult = {
  id: 'customer-id',
  email: 'test@example.com',
  name: 'Test User',
  language: 'en-US',
  avatarUrl: null,
  verifiedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
};

function renderWithRouter(signUpSpy: ISignUp, initialPath = '/signup') {
  const rootRoute = createRootRoute();
  const signupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/signup',
    component: () => <SignUpPage signUp={signUpSpy} />,
  });
  const confirmEmailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/confirm-email',
    component: () => <div>Confirm Email Page</div>,
  });
  const routeTree = rootRoute.addChildren([signupRoute, confirmEmailRoute]);
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({ routeTree, history: memoryHistory });
  // biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register
  renderWithI18n(<RouterProvider router={router as any} />);
  return { router };
}

describe('SignUpPage', () => {
  const makeSut = () => {
    const signUpSpy: ISignUp = { execute: vi.fn() };
    renderWithRouter(signUpSpy);
    return { signUpSpy };
  };

  describe('render', () => {
    it('should display the signup form heading', async () => {
      makeSut();
      expect(await screen.findByText('Create your ledger')).toBeInTheDocument();
    });

    it('should display name, email, password, and language fields', async () => {
      makeSut();
      expect(await screen.findByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Language')).toBeInTheDocument();
    });

    it('should display language options', async () => {
      makeSut();
      const languageSelect = await screen.findByLabelText('Language');
      expect(languageSelect).toBeInTheDocument();
      expect(screen.getByText('English (US)')).toBeInTheDocument();
    });

    it('should display the submit button', async () => {
      makeSut();
      expect(await screen.findByRole('button', { name: 'Initialize Account' })).toBeInTheDocument();
    });

    it('should display link to login page', async () => {
      makeSut();
      expect(await screen.findByText('Sign in')).toBeInTheDocument();
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
    it('should show validation errors when submitting empty form', async () => {
      const { signUpSpy } = makeSut();
      const user = userEvent.setup();

      const submitButton = await screen.findByRole('button', { name: 'Initialize Account' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
      expect(signUpSpy.execute).not.toHaveBeenCalled();
    });

    it('should show error for invalid email', async () => {
      const { signUpSpy } = makeSut();
      const user = userEvent.setup();

      await screen.findByLabelText('Full Name');
      await user.type(screen.getByLabelText('Full Name'), 'Test User');
      await user.type(screen.getByLabelText('Email Address'), 'invalid-email');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Initialize Account' }));

      await waitFor(() => {
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
      });
      expect(signUpSpy.execute).not.toHaveBeenCalled();
    });

    it('should show error for short password', async () => {
      const { signUpSpy } = makeSut();
      const user = userEvent.setup();

      await screen.findByLabelText('Full Name');
      await user.type(screen.getByLabelText('Full Name'), 'Test User');
      await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'short');
      await user.click(screen.getByRole('button', { name: 'Initialize Account' }));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
      expect(signUpSpy.execute).not.toHaveBeenCalled();
    });
  });

  describe('submission', () => {
    const fillAndSubmitForm = async () => {
      const user = userEvent.setup();
      await screen.findByLabelText('Full Name');
      await user.type(screen.getByLabelText('Full Name'), 'Test User');
      await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: 'Initialize Account' }));
    };

    it('should call signUp.execute with form data including language', async () => {
      const { signUpSpy } = makeSut();
      vi.spyOn(signUpSpy, 'execute').mockResolvedValueOnce(signupResult);

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(signUpSpy.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            language: expect.stringMatching(/^(en-US|pt-BR)$/),
          }),
        );
      });
    });

    it('should navigate to /confirm-email on successful signup', async () => {
      const signUpSpy: ISignUp = { execute: vi.fn() };
      vi.spyOn(signUpSpy, 'execute').mockResolvedValueOnce(signupResult);
      renderWithRouter(signUpSpy);

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('Confirm Email Page')).toBeInTheDocument();
      });
    });

    it('should show error message when email is already registered', async () => {
      const { signUpSpy } = makeSut();
      vi.spyOn(signUpSpy, 'execute').mockRejectedValueOnce(new EmailAlreadyRegisteredError());

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument();
      });
    });

    it('should show generic error message on unexpected error', async () => {
      const { signUpSpy } = makeSut();
      vi.spyOn(signUpSpy, 'execute').mockRejectedValueOnce(new UnexpectedError());

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
      });
    });

    it('should disable submit button while submitting', async () => {
      const { signUpSpy } = makeSut();
      let resolveSignUp: (value: typeof signupResult) => void;
      vi.spyOn(signUpSpy, 'execute').mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSignUp = resolve;
          }),
      );

      await fillAndSubmitForm();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
      });

      resolveSignUp!(signupResult);
    });
  });
});
