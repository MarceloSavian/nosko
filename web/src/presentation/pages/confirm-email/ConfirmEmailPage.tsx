import { Trans } from '@lingui/react/macro';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { Logo } from '@/presentation/components/Logo';

export function ConfirmEmailPage() {
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
          <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Icon name="mark_email_read" filled className="text-secondary text-3xl" />
          </div>

          <h2 className="font-headline text-3xl font-bold text-primary tracking-tight mb-4">
            <Trans>Check your inbox</Trans>
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            <Trans>
              We&apos;ve sent a secure activation link to your email. Click it to verify your
              account and start your journey toward financial harmony.
            </Trans>
          </p>

          <div className="flex items-center space-x-3 bg-surface-container-high rounded-xl p-4 mb-8">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
              <Icon name="hourglass_top" className="text-on-primary text-sm" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                <Trans>Verification Status</Trans>
              </p>
              <p className="text-sm text-on-surface">
                <Trans>Activation link expires in 24 hours</Trans>
              </p>
            </div>
          </div>

          <Button type="button" variant="primary" size="lg" fullWidth>
            <Trans>Open Mail App</Trans>
          </Button>

          <button
            type="button"
            className="mt-4 text-sm text-on-surface-variant hover:text-secondary font-medium transition-colors cursor-pointer"
          >
            <Trans>Resend verification email</Trans>
          </button>
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

      <p className="mt-6 text-xs text-secondary flex items-center space-x-1">
        <Icon name="favorite" filled className="text-sm" />
        <span>
          <Trans>Designed for shared financial growth</Trans>
        </span>
      </p>
    </div>
  );
}
