import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { InfoBanner } from '@/presentation/components/InfoBanner';
import { TextInput } from '@/presentation/components/TextInput';

export function InvitePartnerPage() {
  const { t } = useLingui();

  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <div className="w-full max-w-md">
        <Link
          to="/profile"
          className="inline-flex items-center space-x-1 text-sm text-on-surface-variant hover:text-primary transition-colors mb-8"
        >
          <Icon name="chevron_left" className="text-base" />
          <span>
            <Trans>Back</Trans>
          </span>
        </Link>

        <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-6">
          <Trans>Partner Integration &bull; Step 01</Trans>
        </p>

        <h1 className="font-headline text-4xl font-bold text-primary leading-tight mb-2">
          <Trans>
            Invite your <span className="text-secondary italic">Financial Partner</span>
          </Trans>
        </h1>
        <p className="text-on-surface-variant leading-relaxed mb-8">
          <Trans>
            Unified wealth management starts with shared visibility. Enter your partner&apos;s email
            to sync your Unity Ledger.
          </Trans>
        </p>

        <form className="space-y-6">
          <TextInput
            id="partner-email"
            name="partnerEmail"
            type="email"
            label={t`Partner's Email Address`}
            placeholder={t`partner@nosko.com`}
            autoComplete="email"
            icon={<Icon name="mail" className="text-lg" />}
          />
          <p className="text-xs text-on-surface-variant flex items-center space-x-2">
            <Icon name="lock" className="text-sm text-outline" />
            <span>
              <Trans>Secure invitation link will be sent instantly.</Trans>
            </span>
          </p>

          <Link to="/partner-setup/select-accounts">
            <Button type="button" variant="secondary" size="lg" fullWidth className="space-x-2">
              <span>
                <Trans>Send Invitation</Trans>
              </span>
              <Icon name="arrow_forward" className="text-lg" />
            </Button>
          </Link>
        </form>

        <InfoBanner
          icon="favorite"
          iconFilled
          title={<Trans>Unity Connection</Trans>}
          description={
            <Trans>
              Collaborative planning is the core of Nosko. Once accepted, you&apos;ll gain access to
              shared visibility across accounts and joint wealth targets.
            </Trans>
          }
          className="mt-8"
        />

        <p className="mt-12 text-center text-[10px] uppercase tracking-widest text-outline">
          <Trans>Protected via Nosko Unity Protocol</Trans>
        </p>
      </div>
    </div>
  );
}
