import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AdminPasswordNotSetError, InvalidCredentialsError } from '@/domain/errors/auth';
import { type LoginInput, loginInputSchema } from '@/domain/models/auth/Auth';
import type { ILogin } from '@/domain/usecases/auth/ILogin';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { TextInput } from '@/presentation/components/TextInput';
import { useAuth } from '@/presentation/contexts/AuthContext';

type Props = {
  loginUseCase: ILogin;
};

export function LoginPage({ loginUseCase }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginInputSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    try {
      const result = await loginUseCase.execute(data);
      login(result.accessToken);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        setServerError(t`Invalid email or password`);
      } else if (error instanceof AdminPasswordNotSetError) {
        setServerError(t`Password not set. Use forgot password to set your password.`);
      } else {
        setServerError(t`Something went wrong. Please try again.`);
      }
    }
  };

  if (isAuthenticated) {
    return <meta httpEquiv="refresh" content="0;url=/customers" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-headline text-3xl font-bold text-primary">
            <Trans>Nosko Admin</Trans>
          </h1>
          <p className="mt-2 text-on-surface-variant text-sm">
            <Trans>Sign in to the admin panel</Trans>
          </p>
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
            label={t`Password`}
            type={showPassword ? 'text' : 'password'}
            icon={<Icon name="lock" />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? t`Signing in...` : t`Sign in`}
          </Button>

          <div className="text-center">
            <Link to="/forgot-password" className="text-secondary text-sm hover:underline">
              <Trans>Forgot password?</Trans>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
