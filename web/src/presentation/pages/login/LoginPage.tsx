import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link, Navigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EmailNotVerifiedError, InvalidCredentialsError } from '@/domain/errors/auth';
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
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
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
        return;
      }
      if (error instanceof EmailNotVerifiedError) {
        setUnverifiedEmail(data.email);
        return;
      }
      setServerError(t`Something went wrong. Please try again.`);
    }
  };

  if (isAuthenticated) return <Navigate to="/dashboard" />;
  if (unverifiedEmail) return <Navigate to="/confirm-email" search={{ email: unverifiedEmail }} />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background">
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden shadow-[0_32px_64px_-16px_rgba(8,58,79,0.12)] rounded-[2.5rem] bg-white">
        <BrandingPanel />
        <LoginForm
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onSubmit={handleSubmit(onSubmit)}
          register={register}
          errors={errors}
          serverError={serverError}
          isSubmitting={isSubmitting}
        />
      </main>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-6 text-[10px] font-bold text-outline uppercase tracking-widest whitespace-nowrap">
        <span className="hover:text-primary transition-colors cursor-pointer">
          <Trans>Privacy Policy</Trans>
        </span>
        <span className="w-1 h-1 bg-outline-variant rounded-full" />
        <span className="hover:text-primary transition-colors cursor-pointer">
          <Trans>Terms</Trans>
        </span>
        <span className="w-1 h-1 bg-outline-variant rounded-full" />
        <span className="hover:text-primary transition-colors cursor-pointer">
          <Trans>Support</Trans>
        </span>
      </div>
    </div>
  );
}

function BrandingPanel() {
  return (
    <section className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-primary to-primary-container p-16 flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-bl from-secondary/10 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center space-x-3 mb-16">
          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20">
            <Icon name="account_balance" filled className="text-on-secondary" />
          </div>
          <span className="font-headline text-2xl font-extrabold text-white tracking-tight">
            Nosko
          </span>
        </div>
        <h1 className="font-headline text-5xl font-extrabold text-white leading-[1.1] mb-6 max-w-md">
          <Trans>
            Secure your <span className="text-secondary">financial future</span> with Nosko.
          </Trans>
        </h1>
        <p className="text-white/70 text-lg max-w-sm leading-relaxed">
          <Trans>
            A professional-grade ledger designed for modern individuals and collaborative wealth
            management.
          </Trans>
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4">
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
          <div className="text-white/60 text-sm font-medium mb-1">
            <Trans>Total Assets</Trans>
          </div>
          <div className="text-white text-2xl font-bold font-headline">$142,850.00</div>
          <div className="flex items-center text-secondary text-xs mt-2 font-bold">
            <Icon name="trending_up" className="text-sm mr-1" />
            <Trans>+12.5% growth</Trans>
          </div>
        </div>
        <div className="bg-white/5 p-6 rounded-2xl backdrop-blur-md border border-white/10">
          <div className="flex -space-x-2 mb-3">
            <div className="w-8 h-8 rounded-full ring-2 ring-primary bg-primary-fixed-dim" />
            <div className="w-8 h-8 rounded-full ring-2 ring-primary bg-tertiary-fixed-dim" />
          </div>
          <div className="text-white/80 text-xs font-medium">
            <Trans>Shared goal: &ldquo;Real Estate&rdquo;</Trans>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2">
            <div className="bg-secondary h-full rounded-full w-[68%]" />
          </div>
        </div>
      </div>
    </section>
  );
}

type LoginFormProps = {
  showPassword: boolean;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  register: ReturnType<typeof useForm<LoginInput>>['register'];
  errors: ReturnType<typeof useForm<LoginInput>>['formState']['errors'];
  serverError: string;
  isSubmitting: boolean;
};

function LoginForm({
  showPassword,
  onTogglePassword,
  onSubmit,
  register,
  errors,
  serverError,
  isSubmitting,
}: LoginFormProps) {
  const { t } = useLingui();

  return (
    <section className="col-span-1 lg:col-span-5 bg-white p-8 md:p-16 flex flex-col justify-center">
      <div className="lg:hidden flex items-center space-x-2 mb-12">
        <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
          <Icon name="account_balance" filled className="text-on-secondary text-sm" />
        </div>
        <span className="font-headline text-xl font-extrabold text-primary tracking-tight">
          Nosko
        </span>
      </div>

      <div className="max-w-sm mx-auto w-full">
        <header className="mb-10">
          <h2 className="font-headline text-3xl font-bold text-primary tracking-tight mb-2">
            <Trans>Welcome back</Trans>
          </h2>
          <p className="text-on-surface-variant font-medium">
            <Trans>Please enter your credentials</Trans>
          </p>
        </header>

        {serverError && (
          <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
            {serverError}
          </div>
        )}

        <form className="space-y-6" onSubmit={onSubmit} noValidate>
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

          <TextInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            label={t`Password`}
            placeholder="••••••••"
            autoComplete="current-password"
            icon={<Icon name="lock" className="text-lg" />}
            error={errors.password?.message}
            headerRight={
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-secondary hover:underline cursor-pointer"
              >
                <Trans>Forgot Password?</Trans>
              </Link>
            }
            trailing={
              <button
                className="text-outline hover:text-primary cursor-pointer"
                type="button"
                onClick={onTogglePassword}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-lg" />
              </button>
            }
            {...register('password')}
          />

          <div className="pt-2 flex flex-col space-y-4">
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              fullWidth
              className="space-x-2 shadow-xl shadow-secondary/20"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? <Trans>Signing in...</Trans> : <Trans>Sign In</Trans>}</span>
              <Icon name="login" className="text-lg" />
            </Button>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-outline-variant" />
              <span className="flex-shrink mx-4 text-[10px] font-extrabold text-outline uppercase tracking-[0.2em]">
                <Trans>Secure Access</Trans>
              </span>
              <div className="flex-grow border-t border-outline-variant" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-4 bg-surface-container-high rounded-2xl hover:bg-surface-variant transition-colors group cursor-pointer"
              >
                <Icon name="fingerprint" className="text-primary/60 group-hover:text-primary" />
                <span className="text-xs font-bold text-primary/80 group-hover:text-primary">
                  <Trans>Biometric</Trans>
                </span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center space-x-2 py-3 px-4 bg-surface-container-high rounded-2xl hover:bg-surface-variant transition-colors group cursor-pointer"
              >
                <Icon name="face" className="text-primary/60 group-hover:text-primary" />
                <span className="text-xs font-bold text-primary/80 group-hover:text-primary">
                  <Trans>Face ID</Trans>
                </span>
              </button>
            </div>
          </div>
        </form>

        <footer className="mt-12 text-center">
          <p className="text-on-surface-variant text-sm font-medium">
            <Trans>New to Nosko?</Trans>{' '}
            <Link to="/signup" className="text-secondary font-bold hover:underline ml-1">
              <Trans>Create an account</Trans>
            </Link>
          </p>
        </footer>
      </div>
    </section>
  );
}
