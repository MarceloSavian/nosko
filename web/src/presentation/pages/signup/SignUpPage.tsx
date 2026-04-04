import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EmailAlreadyRegisteredError } from '@/domain/errors/auth';
import { type SignupInput, SupportedLocale, signupInputSchema } from '@/domain/models/auth/Auth';
import type { ISignUp } from '@/domain/usecases/auth/ISignUp';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { Select } from '@/presentation/components/Select';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  signUp: ISignUp;
};

export function SignUpPage({ signUp }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupInputSchema),
    defaultValues: {
      language: navigator.language.startsWith('pt') ? SupportedLocale.PT_BR : SupportedLocale.EN_US,
    },
  });

  const onSubmit = async (data: SignupInput) => {
    setServerError('');
    try {
      await signUp.execute(data);
      await navigate({ to: '/confirm-email', search: { email: data.email } });
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        setServerError(t`Email already registered`);
        return;
      }
      setServerError(t`Something went wrong. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background">
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-surface-container-lowest rounded-[2rem] shadow-sm overflow-hidden min-h-[870px]">
        <BrandingPanel />
        <SignUpForm
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onSubmit={handleSubmit(onSubmit)}
          register={register}
          errors={errors}
          serverError={serverError}
          isSubmitting={isSubmitting}
        />
      </main>
    </div>
  );
}

function BrandingPanel() {
  return (
    <section className="hidden lg:flex bg-primary p-12 lg:p-20 flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br from-secondary/20 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-16">
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
            <Icon name="payments" className="text-white text-xl" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tighter font-headline">
            Nosko
          </span>
        </div>
        <div className="max-w-md">
          <p className="text-secondary text-[10px] font-semibold tracking-widest uppercase mb-4">
            <Trans>The Editorial Ledger</Trans>
          </p>
          <h1 className="text-white text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-8 font-headline">
            <Trans>Financial clarity for the modern couple.</Trans>
          </h1>
          <p className="text-on-primary-container text-lg leading-relaxed mb-12">
            <Trans>
              Designed for partners who value transparency, aesthetics, and shared growth.
              Experience the world&apos;s most sophisticated joint wealth management platform.
            </Trans>
          </p>
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                <Icon name="shield_with_heart" filled className="text-secondary" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-none mb-1">
                  <Trans>Estate-Grade Security</Trans>
                </h3>
                <p className="text-on-primary-container text-sm">
                  <Trans>Your data is protected by multi-layered encryption protocols.</Trans>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                <Icon name="auto_graph" filled className="text-secondary" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-none mb-1">
                  <Trans>Growth Syncing</Trans>
                </h3>
                <p className="text-on-primary-container text-sm">
                  <Trans>Automated reconciliation for all your joint assets and accounts.</Trans>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-12 flex items-center gap-6">
        <div className="flex -space-x-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary-fixed-dim" />
          <div className="w-10 h-10 rounded-full border-2 border-primary bg-tertiary-fixed-dim" />
        </div>
        <p className="text-on-primary-container text-xs font-medium">
          <Trans>Joined by 12,000+ couples this month.</Trans>
        </p>
      </div>
    </section>
  );
}

type SignUpFormProps = {
  showPassword: boolean;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
  register: ReturnType<typeof useForm<SignupInput>>['register'];
  errors: ReturnType<typeof useForm<SignupInput>>['formState']['errors'];
  serverError: string;
  isSubmitting: boolean;
};

function SignUpForm({
  showPassword,
  onTogglePassword,
  onSubmit,
  register,
  errors,
  serverError,
  isSubmitting,
}: SignUpFormProps) {
  const { t } = useLingui();

  return (
    <section className="bg-surface-container-low p-8 lg:p-20 flex flex-col justify-center">
      <div className="lg:hidden flex items-center gap-2 mb-12">
        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
          <Icon name="payments" className="text-white text-sm" />
        </div>
        <span className="font-headline text-xl font-extrabold text-primary tracking-tight">
          Nosko
        </span>
      </div>

      <div className="max-w-md mx-auto w-full">
        <header className="mb-10">
          <h2 className="text-primary text-3xl font-extrabold tracking-tight mb-2 font-headline">
            <Trans>Create your ledger</Trans>
          </h2>
          <p className="text-on-surface-variant text-sm">
            <Trans>Start your 30-day premium trial today. No credit card required.</Trans>
          </p>
        </header>

        {serverError && (
          <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
            {serverError}
          </div>
        )}

        <form className="space-y-6" onSubmit={onSubmit} noValidate>
          <TextInput
            id="name"
            type="text"
            label={t`Full Name`}
            placeholder={t`Your name`}
            autoComplete="name"
            error={errors.name?.message}
            {...register('name')}
          />

          <TextInput
            id="email"
            type="email"
            label={t`Email Address`}
            placeholder={t`name@partnership.com`}
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <TextInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            label={t`Password`}
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
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

          <Select
            id="language"
            label={t`Language`}
            error={errors.language?.message}
            {...register('language')}
          >
            <option value="en-US">English (US)</option>
            <option value="pt-BR">Portugu&ecirc;s (BR)</option>
          </Select>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
            {isSubmitting ? <Trans>Creating...</Trans> : <Trans>Initialize Account</Trans>}
          </Button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-on-surface-variant text-sm">
            <Trans>Already have an account?</Trans>{' '}
            <Link to="/login" className="text-secondary font-bold hover:underline ml-1">
              <Trans>Sign in</Trans>
            </Link>
          </p>
        </div>

        <div className="mt-16 flex justify-center lg:justify-start gap-6">
          <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">
            <Trans>Privacy</Trans>
          </span>
          <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">
            <Trans>Terms</Trans>
          </span>
          <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">
            <Trans>Compliance</Trans>
          </span>
        </div>
      </div>
    </section>
  );
}
