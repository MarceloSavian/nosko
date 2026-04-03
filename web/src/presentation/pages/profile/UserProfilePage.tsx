import { Trans } from '@lingui/react/macro';
import { Avatar } from '@/presentation/components/Avatar';
import { Badge } from '@/presentation/components/Badge';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { PageHeader } from '@/presentation/components/PageHeader';
import { PreferenceItem } from '@/presentation/components/PreferenceItem';
import { ProgressBar } from '@/presentation/components/ProgressBar';
import { SectionHeader } from '@/presentation/components/SectionHeader';

function ProfileHero() {
  return (
    <Card variant="hero" padding="lg" className="mb-8">
      <Badge variant="light" size="sm" className="mb-6">
        <Trans>Member Since 2021</Trans>
      </Badge>
      <h2 className="font-headline text-4xl font-bold text-white mb-2">Alex Johnson</h2>
      <p className="text-sm text-on-primary-container leading-relaxed max-w-md mb-8">
        <Trans>
          Curating your financial narrative with intentional growth and collaborative impact.
        </Trans>
      </p>
      <div className="flex items-center space-x-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container mb-1">
            <Trans>Total Net Worth</Trans>
          </p>
          <p className="text-3xl font-headline font-bold text-white">$142,500</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container mb-1">
            <Trans>Impact Score</Trans>
          </p>
          <div className="flex items-center space-x-2">
            <p className="text-3xl font-headline font-bold text-secondary-fixed">98</p>
            <Icon name="auto_awesome" className="text-secondary-fixed text-xl" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function CollaborativeSpiritCard() {
  return (
    <Card variant="default" padding="md" className="mb-8">
      <div className="flex gap-8">
        <div className="flex-1">
          <Badge variant="success" size="sm" className="mb-3">
            <Trans>+2.4% vs last month</Trans>
          </Badge>
          <h3 className="font-headline text-lg font-bold text-on-surface mb-2">
            <Trans>Collaborative Spirit</Trans>
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            <Trans>
              Your shared goals with your partner have reached a new milestone. 85% of joint savings
              achieved.
            </Trans>
          </p>
        </div>
        <div className="w-64 shrink-0">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold text-on-surface">
              <Trans>ALEX (43%)</Trans>
            </span>
            <span className="font-bold text-on-surface">
              <Trans>PARTNER (57%)</Trans>
            </span>
          </div>
          <ProgressBar value={43} size="xl" color="gradient" />
        </div>
      </div>
    </Card>
  );
}

function AccountPreferences() {
  return (
    <section>
      <SectionHeader
        title={<Trans>Account Preferences</Trans>}
        action={
          <button
            type="button"
            className="text-sm font-medium text-secondary hover:underline cursor-pointer flex items-center space-x-1"
          >
            <Trans>Restore Defaults</Trans>
            <Icon name="settings_backup_restore" className="text-base" />
          </button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <PreferenceItem
          icon="account_balance"
          title={<Trans>Bank Connections</Trans>}
          subtitle={<Trans>3 Active institutions linked</Trans>}
        />
        <PreferenceItem
          icon="language"
          title={<Trans>Language</Trans>}
          subtitle={<Trans>English (US)</Trans>}
        />
        <PreferenceItem
          icon="currency_exchange"
          title={<Trans>Currency Defaults</Trans>}
          subtitle="USD ($) & EUR (€)"
        />
        <PreferenceItem
          icon="security"
          title={<Trans>Security &amp; PIN</Trans>}
          subtitle={<Trans>Biometric Unlock Active</Trans>}
        />
        <PreferenceItem
          icon="sync_alt"
          title={<Trans>Partner Sync Settings</Trans>}
          subtitle={<Trans>Connected with Jordan J.</Trans>}
        />
        <Card variant="outlined" padding="none" className="rounded-xl">
          <Button
            type="button"
            variant="link"
            size="md"
            className="w-full py-4 text-error space-x-2"
          >
            <Icon name="logout" className="text-xl" />
            <span>
              <Trans>Sign Out</Trans>
            </span>
          </Button>
        </Card>
      </div>
    </section>
  );
}

function ArchitectureFooter() {
  return (
    <Card variant="default" padding="none" className="mt-10 overflow-hidden">
      <div className="relative h-32 bg-gradient-to-r from-primary/5 to-tertiary/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-outline mb-1">
            <Trans>Designed for the Modern Ledger</Trans>
          </p>
          <p className="font-headline text-lg font-bold text-on-surface">
            <Trans>Nosko Financial Architecture v4.2</Trans>
          </p>
        </div>
      </div>
    </Card>
  );
}

export function UserProfilePage() {
  return (
    <div className="p-8">
      <PageHeader
        title={<Trans>User Profile</Trans>}
        actions={
          <>
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-colors"
            >
              <Icon name="notifications" className="text-xl text-on-surface-variant" />
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-colors"
            >
              <Icon name="settings" className="text-xl text-on-surface-variant" />
            </button>
            <Avatar size="lg" />
          </>
        }
      />

      <ProfileHero />
      <CollaborativeSpiritCard />
      <AccountPreferences />
      <ArchitectureFooter />
    </div>
  );
}
