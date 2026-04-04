import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link, Navigate } from '@tanstack/react-router';
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { InvalidResetCodeError, ResetCodeExpiredError } from '@/domain/errors/password-reset';
import type { IResetPassword } from '@/domain/usecases/password-reset/IResetPassword';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { Logo } from '@/presentation/components/Logo';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  email: string;
  resetPassword: IResetPassword;
};

const newPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

type NewPasswordForm = z.infer<typeof newPasswordSchema>;

export function ResetPasswordPage({ email, resetPassword }: Props) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordSchema),
  });

  if (!email) return <Navigate to="/forgot-password" />;

  if (success) {
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
            <div className="w-14 h-14 bg-tertiary-container rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Icon name="check_circle" filled className="text-tertiary text-3xl" />
            </div>

            <h2 className="font-headline text-3xl font-bold text-primary tracking-tight mb-4">
              <Trans>Password Reset</Trans>
            </h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              <Trans>
                Your password has been successfully reset. You can now sign in with your new
                password.
              </Trans>
            </p>

            <Link to="/login">
              <Button type="button" variant="primary" size="lg" fullWidth>
                <Trans>Go to Login</Trans>
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

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

  const isCodeComplete = code.every((digit) => digit !== '');

  const onSubmit = async (data: NewPasswordForm) => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setServerError('');
    try {
      await resetPassword.execute({ email, code: fullCode, newPassword: data.newPassword });
      setSuccess(true);
    } catch (error) {
      if (error instanceof InvalidResetCodeError) {
        setServerError(t`Invalid reset code. Please check and try again.`);
      } else if (error instanceof ResetCodeExpiredError) {
        setServerError(t`Reset code has expired. Please request a new one.`);
      } else {
        setServerError(t`Something went wrong. Please try again.`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <header className="mb-12 text-center">
        <Logo className="justify-center" />
        <p className="text-xs text-secondary uppercase tracking-widest mt-2">
          <Trans>Unity Ledger</Trans>
        </p>
      </header>

      <main className="w-full max-w-md">
        <div className="bg-surface-container rounded-[2rem] p-10 shadow-sm">
          <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Icon name="password" filled className="text-secondary text-3xl" />
          </div>

          <h2 className="font-headline text-3xl font-bold text-primary tracking-tight mb-4 text-center">
            <Trans>New Password</Trans>
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-2 text-center">
            <Trans>Enter the 6-digit code sent to</Trans>
          </p>
          <p className="text-primary font-bold mb-8 text-center">{email}</p>

          {serverError && (
            <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
              {serverError}
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

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextInput
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              label={t`New Password`}
              placeholder="••••••••"
              autoComplete="new-password"
              icon={<Icon name="lock" className="text-lg" />}
              error={errors.newPassword?.message}
              trailing={
                <button
                  className="text-outline hover:text-primary cursor-pointer"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-lg" />
                </button>
              }
              {...register('newPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isCodeComplete || isSubmitting}
            >
              {isSubmitting ? <Trans>Resetting...</Trans> : <Trans>Reset Password</Trans>}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant text-sm">
            <Trans>Didn&apos;t receive the code?</Trans>{' '}
            <Link to="/forgot-password" className="text-secondary font-bold hover:underline ml-1">
              <Trans>Request again</Trans>
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
