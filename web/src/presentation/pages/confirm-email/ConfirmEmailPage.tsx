import { Trans, useLingui } from '@lingui/react/macro';
import { Link, Navigate } from '@tanstack/react-router';
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from 'react';
import {
  EmailAlreadyVerifiedError,
  InvalidVerificationCodeError,
  VerificationCodeExpiredError,
} from '@/domain/errors/auth';
import type { IResendVerification } from '@/domain/usecases/auth/IResendVerification';
import type { IVerifyEmail } from '@/domain/usecases/auth/IVerifyEmail';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { Logo } from '@/presentation/components/Logo';
import { EmailVerifiedPage } from './EmailVerifiedPage';

type Props = {
  email: string;
  verifyEmail: IVerifyEmail;
  resendVerification: IResendVerification;
};

export function ConfirmEmailPage({ email, verifyEmail, resendVerification }: Props) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [serverError, setServerError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { t } = useLingui();

  if (!email) return <Navigate to="/signup" />;
  if (verified) return <EmailVerifiedPage />;

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) return;

    const newCode = [...code];
    newCode[index] = value.charAt(0);
    setCode(newCode);
    setServerError('');

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (code[index]) {
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      } else if (index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted.charAt(i);
    }
    setCode(newCode);
    setServerError('');

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setIsVerifying(true);
    setServerError('');
    try {
      await verifyEmail.execute({ email, code: fullCode });
      setVerified(true);
    } catch (error) {
      if (error instanceof EmailAlreadyVerifiedError) {
        setVerified(true);
        return;
      }
      if (error instanceof InvalidVerificationCodeError) {
        setServerError(t`Invalid verification code. Please check and try again.`);
      } else if (error instanceof VerificationCodeExpiredError) {
        setServerError(t`Verification code has expired. Please request a new one.`);
      } else {
        setServerError(t`Something went wrong. Please try again.`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setServerError('');
    setResendSuccess(false);
    try {
      await resendVerification.execute({ email });
      setResendSuccess(true);
    } catch (error) {
      if (error instanceof EmailAlreadyVerifiedError) {
        setVerified(true);
        return;
      }
      setServerError(t`Failed to resend verification email. Please try again.`);
    } finally {
      setIsResending(false);
    }
  };

  const isCodeComplete = code.every((digit) => digit !== '');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <header className="mb-12 text-center">
        <Logo className="justify-center" />
        <p className="text-xs text-secondary uppercase tracking-widest mt-2">
          <Trans>Unity Ledger</Trans>
        </p>
      </header>

      <main className="w-full max-w-md">
        <div className="bg-surface-container rounded-[2rem] p-10 shadow-sm text-center">
          <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Icon name="mark_email_read" filled className="text-secondary text-3xl" />
          </div>

          <h2 className="font-headline text-3xl font-bold text-primary tracking-tight mb-4">
            <Trans>Check your inbox</Trans>
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-2">
            <Trans>We&apos;ve sent a 6-digit verification code to</Trans>
          </p>
          <p className="text-primary font-bold mb-8">{email}</p>

          {serverError && (
            <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
              {serverError}
            </div>
          )}

          {resendSuccess && (
            <div className="mb-6 p-4 bg-secondary/10 rounded-xl text-secondary text-sm font-medium">
              <Trans>A new verification code has been sent to your email.</Trans>
            </div>
          )}

          <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
            {code.map((digit, index) => {
              const key = `digit-${index}`;
              return (
                <input
                  key={key}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold text-primary bg-surface-container-highest rounded-xl border-none focus:ring-2 focus:ring-tertiary/20 outline-none transition-all"
                />
              );
            })}
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isCodeComplete || isVerifying}
            onClick={handleVerify}
          >
            {isVerifying ? <Trans>Verifying...</Trans> : <Trans>Verify Email</Trans>}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="mt-4 text-sm text-on-surface-variant hover:text-secondary font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isResending ? <Trans>Sending...</Trans> : <Trans>Resend verification code</Trans>}
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant text-sm">
            <Trans>Wrong email?</Trans>{' '}
            <Link to="/signup" className="text-secondary font-bold hover:underline ml-1">
              <Trans>Sign up again</Trans>
            </Link>
          </p>
        </div>
      </main>

      <footer className="mt-12 flex items-center space-x-6 text-xs text-outline">
        <span className="hover:text-primary transition-colors cursor-pointer">
          <Trans>Privacy Policy</Trans>
        </span>
        <span className="w-1 h-1 bg-outline-variant rounded-full" />
        <span className="hover:text-primary transition-colors cursor-pointer">
          <Trans>Support Center</Trans>
        </span>
        <span className="w-1 h-1 bg-outline-variant rounded-full" />
        <span className="hover:text-primary transition-colors cursor-pointer">
          <Trans>Safety</Trans>
        </span>
      </footer>
    </div>
  );
}
