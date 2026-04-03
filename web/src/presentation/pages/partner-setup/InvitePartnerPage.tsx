import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { Badge } from '@/presentation/components/Badge';
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
          className="inline-flex items-center space-x-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-8"
        >
          <Icon name="chevron_left" className="text-base" />
          <span>
            <Trans>Back</Trans>
          </span>
        </Link>

        <Badge variant="success" size="md" className="mb-6">
          <Trans>Partner Setup &bull; Step 01</Trans>
        </Badge>

        <h1 className="font-headline text-4xl font-bold text-on-surface leading-tight mb-2">
          <Trans>
            Invite your <span className="text-secondary italic">Financial Partner</span>
          </Trans>
        </h1>
        <p className="text-on-surface-variant leading-relaxed mb-8">
          <Trans>
            Sharing a ledger is the first step toward collaborative prosperity. Enter their email to
            begin the syncing process.
          </Trans>
        </p>

        <form className="space-y-6">
          <TextInput
            id="partner-email"
            name="partnerEmail"
            type="email"
            label={t`Partner Email`}
            placeholder={t`name@example.com`}
            autoComplete="email"
            icon={<Icon name="mail" className="text-lg" />}
          />
          <p className="text-xs text-on-surface-variant flex items-center space-x-2">
            <Icon name="info" className="text-sm text-outline" />
            <span>
              <Trans>They&apos;ll receive an invitation to join your shared dashboard.</Trans>
            </span>
          </p>

          <Link to="/partner-setup/select-accounts">
            <Button type="button" variant="dark" size="lg" fullWidth className="space-x-2">
              <span>
                <Trans>Next Step</Trans>
              </span>
              <Icon name="arrow_forward" className="text-lg" />
            </Button>
          </Link>
        </form>

        <InfoBanner
          icon="favorite"
          iconFilled
          title={<Trans>Building Harmony</Trans>}
          description={
            <Trans>
              Financial transparency is the foundation of a resilient partnership. Once connected,
              you can both view assets and set shared goals.
            </Trans>
          }
          className="mt-8"
        />

        <p className="mt-12 text-center text-[10px] uppercase tracking-widest text-outline">
          <Trans>Secured by Financial Harmony Editorial Ledger</Trans>
        </p>
      </div>
    </div>
  );
}
