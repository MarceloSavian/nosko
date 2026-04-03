import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { Logo } from '@/presentation/components/Logo';
import { TextInput } from '@/presentation/components/TextInput';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 lg:p-24 relative overflow-hidden bg-background">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-fixed-dim/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-tertiary-fixed-dim/10 rounded-full blur-[100px]" />

      <main className="relative w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden shadow-[0_30px_60px_-15px_rgba(25,28,29,0.08)] rounded-[2.5rem]">
        <BrandingPanel />
        <LoginForm
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onSubmit={handleSubmit}
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
            The Editorial <span className="text-secondary-fixed">Ledger</span> of Your Financial
            Life.
          </Trans>
        </h1>
        <p className="text-on-primary-container text-lg max-w-sm leading-relaxed">
          <Trans>
            Curate your wealth with a platform designed for clarity, growth, and collaborative
            harmony.
          </Trans>
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4">
        <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl">
          <div className="text-on-primary-fixed-variant text-sm font-medium mb-1">
            <Trans>Total Harmony</Trans>
          </div>
          <div className="text-white text-2xl font-bold font-headline">$142,850.00</div>
          <div className="flex items-center text-secondary-fixed text-xs mt-2">
            <Icon name="trending_up" className="text-sm mr-1" />
            <Trans>+12.5% this month</Trans>
          </div>
        </div>
        <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md">
          <div className="flex -space-x-2 mb-3">
            <div className="w-8 h-8 rounded-full ring-2 ring-primary bg-primary-fixed-dim" />
            <div className="w-8 h-8 rounded-full ring-2 ring-primary bg-tertiary-fixed-dim" />
          </div>
          <div className="text-white/80 text-sm">
            <Trans>Collaborative goal: &ldquo;New Home&rdquo; at 68%</Trans>
          </div>
        </div>
      </div>
    </section>
  );
}

type LoginFormProps = {
  showPassword: boolean;
  onTogglePassword: () => void;
  onSubmit: (e: FormEvent) => void;
};

function LoginForm({ showPassword, onTogglePassword, onSubmit }: LoginFormProps) {
  const { t } = useLingui();

  return (
    <section className="col-span-1 lg:col-span-5 bg-surface-container-lowest p-8 md:p-16 flex flex-col justify-center">
      <div className="lg:hidden mb-12">
        <Logo />
      </div>

      <div className="max-w-sm mx-auto w-full">
        <header className="mb-10">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-2">
            <Trans>Welcome back</Trans>
          </h2>
          <p className="text-on-surface-variant font-medium">
            <Trans>Continue to your Unity Ledger</Trans>
          </p>
        </header>

        <form className="space-y-6" onSubmit={onSubmit}>
          <TextInput
            id="email"
            name="email"
            type="email"
            label={t`Email Address`}
            placeholder={t`name@company.com`}
            autoComplete="email"
            icon={<Icon name="mail" className="text-lg" />}
          />

          <TextInput
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label={t`Password`}
            placeholder="••••••••"
            autoComplete="current-password"
            icon={<Icon name="lock" className="text-lg" />}
            headerRight={
              <Button type="button" variant="link" size="sm" className="text-xs p-0">
                <Trans>Forgot Password?</Trans>
              </Button>
            }
            trailing={
              <button
                className="text-outline hover:text-on-surface-variant cursor-pointer"
                type="button"
                onClick={onTogglePassword}
              >
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-lg" />
              </button>
            }
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" size="lg" fullWidth className="space-x-2">
              <span>
                <Trans>Sign In to Suomi</Trans>
              </span>
              <Icon name="arrow_forward" className="text-lg" />
            </Button>
          </div>
        </form>

        <footer className="mt-12 text-center">
          <p className="text-on-surface-variant text-sm">
            <Trans>Don&apos;t have an account?</Trans>{' '}
            <span className="text-secondary font-bold hover:underline decoration-2 underline-offset-4 ml-1 cursor-pointer">
              <Trans>Start your journey</Trans>
            </span>
          </p>
        </footer>
      </div>
    </section>
  );
}
