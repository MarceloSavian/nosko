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
import { Logo } from '@/presentation/components/Logo';
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
      await navigate({ to: '/confirm-email' });
    } catch (error) {
      if (error instanceof EmailAlreadyRegisteredError) {
        setServerError(t`Email already registered`);
        return;
      }
      setServerError(t`Something went wrong. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 lg:p-24 relative overflow-hidden bg-background">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-tertiary-fixed-dim/10 rounded-full blur-[100px]" />

      <main className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden shadow-[0_30px_60px_-15px_rgba(25,28,29,0.08)] rounded-[2.5rem]">
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

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-6 text-xs font-bold text-outline uppercase tracking-wider">
        <Link to="/" className="hover:text-primary transition-colors">
          <Trans>Home</Trans>
        </Link>
        <span className="w-1 h-1 bg-outline-variant rounded-full" />
        <span className="hover:text-primary transition-colors cursor-pointer">
          <Trans>Contact Support</Trans>
        </span>
      </div>
    </div>
  );
}

function BrandingPanel() {
  return (
    <section className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-primary to-primary-container p-16 flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-secondary/10 to-transparent" />
      </div>

      <div className="relative z-10">
        <Logo size="lg" tone="light" className="mb-12" />
        <h1 className="font-headline text-5xl font-bold text-white leading-tight mb-6 max-w-md">
          <Trans>
            The Editorial Ledger for the <span className="text-secondary-fixed">Modern Couple</span>
            .
          </Trans>
        </h1>
        <p className="text-on-primary-container text-lg max-w-sm leading-relaxed">
          <Trans>
            Secure your shared future with a financial space designed for growth, transparency, and
            high-end curation.
          </Trans>
        </p>
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-xl p-6 rounded-2xl">
        <div className="flex -space-x-2 mb-3">
          <div className="w-8 h-8 rounded-full ring-2 ring-primary bg-primary-fixed-dim" />
          <div className="w-8 h-8 rounded-full ring-2 ring-primary bg-tertiary-fixed-dim" />
        </div>
        <p className="text-white/90 text-sm italic leading-relaxed mb-2">
          <Trans>
            &ldquo;Nosko transformed how we see our wealth. It&apos;s not just a tracker; it&apos;s
            our digital home for our dreams.&rdquo;
          </Trans>
        </p>
        <p className="text-secondary-fixed text-xs font-bold">
          <Trans>Alex & Jordan &middot; Premium Members</Trans>
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
    <section className="col-span-1 lg:col-span-5 bg-surface-container-lowest p-8 md:p-16 flex flex-col justify-center">
      <div className="lg:hidden mb-12">
        <Logo />
      </div>

      <div className="max-w-sm mx-auto w-full">
        <header className="mb-10">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-2">
            <Trans>Create your account</Trans>
          </h2>
          <p className="text-on-surface-variant font-medium">
            <Trans>Start your shared financial journey today.</Trans>
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
            icon={<Icon name="person" className="text-lg" />}
            error={errors.name?.message}
            {...register('name')}
          />

          <TextInput
            id="email"
            type="email"
            label={t`Email Address`}
            placeholder={t`hello@example.com`}
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
            autoComplete="new-password"
            icon={<Icon name="lock" className="text-lg" />}
            error={errors.password?.message}
            trailing={
              <button
                className="text-outline hover:text-on-surface-variant cursor-pointer"
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
            icon={<Icon name="language" className="text-lg" />}
            error={errors.language?.message}
            {...register('language')}
          >
            <option value="en-US">English (US)</option>
            <option value="pt-BR">Portugu&ecirc;s (BR)</option>
          </Select>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              className="space-x-2"
              disabled={isSubmitting}
            >
              <span>
                {isSubmitting ? <Trans>Creating...</Trans> : <Trans>Create Unity Ledger</Trans>}
              </span>
            </Button>
          </div>
        </form>

        <footer className="mt-12 text-center">
          <p className="text-on-surface-variant text-sm">
            <Trans>Already have an account?</Trans>{' '}
            <Link
              to="/login"
              className="text-secondary font-bold hover:underline decoration-2 underline-offset-4 ml-1"
            >
              <Trans>Log In</Trans>
            </Link>
          </p>
        </footer>

        <div className="mt-8 flex items-center justify-center space-x-4 text-xs text-outline">
          <div className="flex items-center space-x-1">
            <Icon name="lock" className="text-sm" />
            <span>
              <Trans>256-BIT SSL</Trans>
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="verified_user" className="text-sm" />
            <span>
              <Trans>ENCRYPTED</Trans>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
