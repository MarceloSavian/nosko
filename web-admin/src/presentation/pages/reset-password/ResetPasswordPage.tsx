import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { InvalidResetCodeError, ResetCodeExpiredError } from '@/domain/errors/auth';
import { type ResetPasswordInput, resetPasswordInputSchema } from '@/domain/models/auth/Auth';
import type { IResetPassword } from '@/domain/usecases/auth/IResetPassword';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  resetPassword: IResetPassword;
};

export function ResetPasswordPage({ resetPassword }: Props) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordInputSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setServerError('');
    try {
      await resetPassword.execute(data);
      setSuccess(true);
    } catch (error) {
      if (error instanceof InvalidResetCodeError) {
        setServerError(t`Invalid reset code`);
      } else if (error instanceof ResetCodeExpiredError) {
        setServerError(t`Reset code expired`);
      } else {
        setServerError(t`Something went wrong. Please try again.`);
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <Icon name="check_circle" className="text-6xl text-secondary" />
          <h2 className="font-headline text-2xl font-bold text-primary">
            <Trans>Password reset</Trans>
          </h2>
          <Link to="/login" className="text-secondary hover:underline text-sm">
            <Trans>Go to login</Trans>
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
            <Trans>Reset password</Trans>
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError && (
            <div className="bg-error-container text-on-error-container px-4 py-3 rounded-2xl text-sm">
              {serverError}
            </div>
          )}

          <TextInput
            label={t`Email`}
            type="email"
            icon={<Icon name="mail" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <TextInput
            label={t`Reset code`}
            icon={<Icon name="pin" />}
            maxLength={6}
            error={errors.code?.message}
            {...register('code')}
          />

          <TextInput
            label={t`New password`}
            type="password"
            icon={<Icon name="lock" />}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? t`Resetting...` : t`Reset password`}
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
