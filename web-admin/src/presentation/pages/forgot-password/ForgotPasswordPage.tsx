import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  type RequestPasswordResetInput,
  requestPasswordResetInputSchema,
} from '@/domain/models/auth/Auth';
import type { IRequestPasswordReset } from '@/domain/usecases/auth/IRequestPasswordReset';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  requestPasswordReset: IRequestPasswordReset;
};

export function ForgotPasswordPage({ requestPasswordReset }: Props) {
  const [sent, setSent] = useState(false);
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetInputSchema),
  });

  const onSubmit = async (data: RequestPasswordResetInput) => {
    await requestPasswordReset.execute(data);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <Icon name="mark_email_read" className="text-6xl text-secondary" />
          <h2 className="font-headline text-2xl font-bold text-primary">
            <Trans>Check your email</Trans>
          </h2>
          <p className="text-on-surface-variant text-sm">
            <Trans>If the email exists, a reset code was sent.</Trans>
          </p>
          <Link to="/reset-password" className="text-secondary hover:underline text-sm">
            <Trans>Enter reset code</Trans>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-2xl font-bold text-primary">
            <Trans>Forgot password</Trans>
          </h1>
          <p className="mt-2 text-on-surface-variant text-sm">
            <Trans>Enter your email to receive a reset code</Trans>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <TextInput
            label={t`Email`}
            type="email"
            icon={<Icon name="mail" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? t`Sending...` : t`Send reset code`}
          </Button>

          <div className="text-center">
            <Link to="/login" className="text-secondary text-sm hover:underline">
              <Trans>Back to login</Trans>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
