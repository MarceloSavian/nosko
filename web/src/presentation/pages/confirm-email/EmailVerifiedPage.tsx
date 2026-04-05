import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { Logo } from '@/presentation/components/Logo';

export function EmailVerifiedPage() {
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
            <Icon name="verified" filled className="text-tertiary text-3xl" />
          </div>

          <h2 className="font-headline text-3xl font-bold text-primary tracking-tight mb-4">
            <Trans>Email Verified</Trans>
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            <Trans>
              Your email has been successfully confirmed. You can now sign in to your account.
            </Trans>
          </p>

          <Link to="/login">
            <Button type="button" variant="primary" size="lg" fullWidth>
              <Trans>Go to Login</Trans>
            </Button>
          </Link>
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
