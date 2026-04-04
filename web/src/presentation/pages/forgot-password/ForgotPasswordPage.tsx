import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  type RequestPasswordResetInput,
  requestPasswordResetInputSchema,
} from '@/domain/models/password-reset/PasswordReset';
import type { IRequestPasswordReset } from '@/domain/usecases/password-reset/IRequestPasswordReset';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { Logo } from '@/presentation/components/Logo';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  requestPasswordReset: IRequestPasswordReset;
};

export function ForgotPasswordPage({ requestPasswordReset }: Props) {
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetInputSchema),
  });

  const onSubmit = async (data: RequestPasswordResetInput) => {
    setServerError('');
    try {
      await requestPasswordReset.execute(data);
      navigate({ to: '/reset-password', search: { email: data.email } });
    } catch {
      setServerError(t`Something went wrong. Please try again.`);
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
            <Icon name="lock_reset" filled className="text-secondary text-3xl" />
          </div>

          <h2 className="font-headline text-3xl font-bold text-primary tracking-tight mb-4 text-center">
            <Trans>Reset Password</Trans>
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-8 text-center">
            <Trans>
              Enter your email address and we&apos;ll send you a code to reset your password.
            </Trans>
          </p>

          {serverError && (
            <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
              {serverError}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextInput
              id="email"
              type="email"
              label={t`Email Address`}
              placeholder={t`name@company.com`}
              autoComplete="email"
              icon={<Icon name="mail" className="text-lg" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
              {isSubmitting ? <Trans>Sending...</Trans> : <Trans>Send Reset Code</Trans>}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant text-sm">
            <Trans>Remember your password?</Trans>{' '}
            <Link to="/login" className="text-secondary font-bold hover:underline ml-1">
              <Trans>Sign in</Trans>
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
