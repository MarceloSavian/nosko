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
  EmailAlreadyVerifiedError,
  InvalidVerificationCodeError,
  VerificationCodeExpiredError,
} from '@/domain/errors/auth';
import type { IResendVerification } from '@/domain/usecases/auth/IResendVerification';
import type { IVerifyEmail } from '@/domain/usecases/auth/IVerifyEmail';
import { renderWithI18n } from '@/test/i18n';
import { ConfirmEmailPage } from './ConfirmEmailPage';

function renderWithRouter(
  verifyEmailSpy: IVerifyEmail,
  resendSpy: IResendVerification,
  email = 'test@example.com',
  initialPath = '/confirm-email',
) {
  const rootRoute = createRootRoute();
  const confirmEmailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/confirm-email',
    component: () => (
      <ConfirmEmailPage email={email} verifyEmail={verifyEmailSpy} resendVerification={resendSpy} />
    ),
  });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: () => <div>Login Page</div>,
  });
  const signupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/signup',
    component: () => <div>Signup Page</div>,
  });
  const routeTree = rootRoute.addChildren([confirmEmailRoute, loginRoute, signupRoute]);
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({ routeTree, history: memoryHistory });
  // biome-ignore lint/suspicious/noExplicitAny: test router type mismatch with register
  renderWithI18n(<RouterProvider router={router as any} />);
  return { router };
}

function getDigitInputs() {
  const inputs = screen.getAllByRole('textbox');
  if (inputs.length !== 6) throw new Error('Expected 6 digit inputs');
  return inputs as [HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement];
}

describe('ConfirmEmailPage', () => {
  const makeSut = () => {
    const verifyEmailSpy: IVerifyEmail = { execute: vi.fn() };
    const resendSpy: IResendVerification = { execute: vi.fn() };
    renderWithRouter(verifyEmailSpy, resendSpy);
    return { verifyEmailSpy, resendSpy };
  };

  describe('render', () => {
    it('should display the heading', async () => {
      makeSut();
      expect(await screen.findByText('Check your inbox')).toBeInTheDocument();
    });

    it('should display the email address', async () => {
      makeSut();
      expect(await screen.findByText('test@example.com')).toBeInTheDocument();
    });

    it('should display 6 digit inputs', async () => {
      makeSut();
      await screen.findByText('Check your inbox');
      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(6);
    });

    it('should display verify button', async () => {
      makeSut();
      expect(await screen.findByRole('button', { name: 'Verify Email' })).toBeInTheDocument();
    });

    it('should display resend button', async () => {
      makeSut();
      expect(
        await screen.findByRole('button', { name: 'Resend verification code' }),
      ).toBeInTheDocument();
    });

    it('should display link to signup', async () => {
      makeSut();
      expect(await screen.findByText('Sign up again')).toBeInTheDocument();
    });
  });

  describe('redirect when no email', () => {
    it('should redirect to /signup when email is empty', async () => {
      const verifyEmailSpy: IVerifyEmail = { execute: vi.fn() };
      const resendSpy: IResendVerification = { execute: vi.fn() };
      renderWithRouter(verifyEmailSpy, resendSpy, '');

      await waitFor(() => {
        expect(screen.getByText('Signup Page')).toBeInTheDocument();
      });
    });
  });

  describe('code input', () => {
    it('should verify button be disabled when code is incomplete', async () => {
      makeSut();
      const verifyButton = await screen.findByRole('button', { name: 'Verify Email' });
      expect(verifyButton).toBeDisabled();
    });

    it('should allow typing digits into individual inputs', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Check your inbox');
      const inputs = getDigitInputs();
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');
      await user.type(inputs[2], '3');
      await user.type(inputs[3], '4');
      await user.type(inputs[4], '5');
      await user.type(inputs[5], '6');

      expect(inputs[0]).toHaveValue('1');
      expect(inputs[5]).toHaveValue('6');
    });

    it('should clear current digit on backspace', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Check your inbox');
      const inputs = getDigitInputs();
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');

      await user.click(inputs[1]);
      await user.keyboard('{Backspace}');

      expect(inputs[1]).toHaveValue('');
    });

    it('should move focus to previous input on backspace when current is empty', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Check your inbox');
      const inputs = getDigitInputs();
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');

      await user.click(inputs[1]);
      await user.keyboard('{Backspace}');
      await user.keyboard('{Backspace}');

      expect(inputs[0]).toHaveValue('');
    });

    it('should handle pasting a full code', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Check your inbox');
      const inputs = getDigitInputs();
      await user.click(inputs[0]);
      await user.paste('123456');

      await waitFor(() => {
        expect(inputs[0]).toHaveValue('1');
        expect(inputs[1]).toHaveValue('2');
        expect(inputs[2]).toHaveValue('3');
        expect(inputs[3]).toHaveValue('4');
        expect(inputs[4]).toHaveValue('5');
        expect(inputs[5]).toHaveValue('6');
      });
    });

    it('should ignore non-numeric characters when pasting', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Check your inbox');
      const inputs = getDigitInputs();
      await user.click(inputs[0]);
      await user.paste('abc');

      expect(inputs[0]).toHaveValue('');
    });
  });

  describe('verify submission', () => {
    const fillCode = async () => {
      const user = userEvent.setup();
      await screen.findByText('Check your inbox');
      const inputs = getDigitInputs();
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');
      await user.type(inputs[2], '3');
      await user.type(inputs[3], '4');
      await user.type(inputs[4], '5');
      await user.type(inputs[5], '6');
      return { user };
    };

    it('should call verifyEmail with correct input', async () => {
      const { verifyEmailSpy } = makeSut();
      vi.spyOn(verifyEmailSpy, 'execute').mockResolvedValueOnce();

      await fillCode();
      await userEvent.click(screen.getByRole('button', { name: 'Verify Email' }));

      await waitFor(() => {
        expect(verifyEmailSpy.execute).toHaveBeenCalledWith({
          email: 'test@example.com',
          code: '123456',
        });
      });
    });

    it('should show EmailVerifiedPage on successful verification', async () => {
      const verifyEmailSpy: IVerifyEmail = { execute: vi.fn() };
      const resendSpy: IResendVerification = { execute: vi.fn() };
      vi.spyOn(verifyEmailSpy, 'execute').mockResolvedValueOnce();
      renderWithRouter(verifyEmailSpy, resendSpy);

      await fillCode();
      await userEvent.click(screen.getByRole('button', { name: 'Verify Email' }));

      await waitFor(() => {
        expect(screen.getByText('Email Verified')).toBeInTheDocument();
      });
    });

    it('should show EmailVerifiedPage when EmailAlreadyVerifiedError', async () => {
      const verifyEmailSpy: IVerifyEmail = { execute: vi.fn() };
      const resendSpy: IResendVerification = { execute: vi.fn() };
      vi.spyOn(verifyEmailSpy, 'execute').mockRejectedValueOnce(new EmailAlreadyVerifiedError());
      renderWithRouter(verifyEmailSpy, resendSpy);

      await fillCode();
      await userEvent.click(screen.getByRole('button', { name: 'Verify Email' }));

      await waitFor(() => {
        expect(screen.getByText('Email Verified')).toBeInTheDocument();
      });
    });

    it('should show error for invalid verification code', async () => {
      const { verifyEmailSpy } = makeSut();
      vi.spyOn(verifyEmailSpy, 'execute').mockRejectedValueOnce(new InvalidVerificationCodeError());

      await fillCode();
      await userEvent.click(screen.getByRole('button', { name: 'Verify Email' }));

      await waitFor(() => {
        expect(
          screen.getByText('Invalid verification code. Please check and try again.'),
        ).toBeInTheDocument();
      });
    });

    it('should show error for expired verification code', async () => {
      const { verifyEmailSpy } = makeSut();
      vi.spyOn(verifyEmailSpy, 'execute').mockRejectedValueOnce(new VerificationCodeExpiredError());

      await fillCode();
      await userEvent.click(screen.getByRole('button', { name: 'Verify Email' }));

      await waitFor(() => {
        expect(
          screen.getByText('Verification code has expired. Please request a new one.'),
        ).toBeInTheDocument();
      });
    });

    it('should show generic error on unexpected error', async () => {
      const { verifyEmailSpy } = makeSut();
      vi.spyOn(verifyEmailSpy, 'execute').mockRejectedValueOnce(new Error('network error'));

      await fillCode();
      await userEvent.click(screen.getByRole('button', { name: 'Verify Email' }));

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
      });
    });

    it('should disable verify button while verifying', async () => {
      const { verifyEmailSpy } = makeSut();
      let resolveVerify: () => void;
      vi.spyOn(verifyEmailSpy, 'execute').mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveVerify = resolve;
          }),
      );

      await fillCode();
      await userEvent.click(screen.getByRole('button', { name: 'Verify Email' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Verifying...' })).toBeDisabled();
      });

      resolveVerify!();
    });
  });

  describe('resend verification', () => {
    it('should call resendVerification with correct email', async () => {
      const { resendSpy } = makeSut();
      vi.spyOn(resendSpy, 'execute').mockResolvedValueOnce();

      const resendButton = await screen.findByRole('button', {
        name: 'Resend verification code',
      });
      await userEvent.click(resendButton);

      await waitFor(() => {
        expect(resendSpy.execute).toHaveBeenCalledWith({ email: 'test@example.com' });
      });
    });

    it('should show success message after resending', async () => {
      const { resendSpy } = makeSut();
      vi.spyOn(resendSpy, 'execute').mockResolvedValueOnce();

      const resendButton = await screen.findByRole('button', {
        name: 'Resend verification code',
      });
      await userEvent.click(resendButton);

      await waitFor(() => {
        expect(
          screen.getByText('A new verification code has been sent to your email.'),
        ).toBeInTheDocument();
      });
    });

    it('should show EmailVerifiedPage when resend returns EmailAlreadyVerifiedError', async () => {
      const verifyEmailSpy: IVerifyEmail = { execute: vi.fn() };
      const resendSpy: IResendVerification = { execute: vi.fn() };
      vi.spyOn(resendSpy, 'execute').mockRejectedValueOnce(new EmailAlreadyVerifiedError());
      renderWithRouter(verifyEmailSpy, resendSpy);

      const resendButton = await screen.findByRole('button', {
        name: 'Resend verification code',
      });
      await userEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Email Verified')).toBeInTheDocument();
      });
    });

    it('should show error on resend failure', async () => {
      const { resendSpy } = makeSut();
      vi.spyOn(resendSpy, 'execute').mockRejectedValueOnce(new Error('network error'));

      const resendButton = await screen.findByRole('button', {
        name: 'Resend verification code',
      });
      await userEvent.click(resendButton);

      await waitFor(() => {
        expect(
          screen.getByText('Failed to resend verification email. Please try again.'),
        ).toBeInTheDocument();
      });
    });
  });
});
