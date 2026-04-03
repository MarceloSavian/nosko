import { Trans } from '@lingui/react/macro';
import { Avatar } from '@/presentation/components/Avatar';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { ProgressBar } from '@/presentation/components/ProgressBar';

function ProfileHero() {
  return (
    <Card variant="dark" padding="lg" className="mb-8">
      <span className="px-3 py-1 bg-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-widest rounded-full inline-block mb-6">
        <Trans>Member Since 2021</Trans>
      </span>
      <h2 className="font-headline text-4xl font-bold text-white mb-2">Alex Johnson</h2>
      <p className="text-sm text-on-primary-container leading-relaxed max-w-md mb-8">
        <Trans>
          Defining your financial legacy through precision management and strategic growth.
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
            <p className="text-3xl font-headline font-bold text-secondary">98</p>
            <Icon name="auto_awesome" className="text-secondary text-xl" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PortfolioSynergyCard() {
  return (
    <Card variant="default" padding="lg" className="mb-8">
      <div className="flex gap-8 items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <IconBox icon="groups" size="sm" tone="secondary" shape="circle" />
            <h3 className="font-headline text-lg font-bold text-primary">
              <Trans>Portfolio Synergy</Trans>
            </h3>
          </div>
          <span className="text-xs text-tertiary font-bold">
            <Trans>+2.4% this month</Trans>
          </span>
          <p className="text-sm text-on-surface-variant leading-relaxed mt-2">
            <Trans>
              Your collaborative efforts have reached a new milestone. 85% of target liquidity goals
              achieved.
            </Trans>
          </p>
        </div>
        <div className="w-64 shrink-0">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold text-primary">
              <Trans>Personal (42%)</Trans>
            </span>
            <span className="font-bold text-primary">
              <Trans>Joint (58%)</Trans>
            </span>
          </div>
          <ProgressBar value={42} size="xl" color="gradient" />
        </div>
      </div>
    </Card>
  );
}

function AccountPreferences() {
  const preferences = [
    {
      icon: 'account_balance',
      title: <Trans>Banking Integration</Trans>,
      subtitle: <Trans>3 institutions currently synchronized</Trans>,
    },
    {
      icon: 'language',
      title: <Trans>Localization</Trans>,
      subtitle: <Trans>English (US) · International Edition</Trans>,
    },
    {
      icon: 'currency_exchange',
      title: <Trans>Base Currencies</Trans>,
      subtitle: 'USD Primary / EUR Secondary Market',
    },
    {
      icon: 'security',
      title: <Trans>Encryption &amp; Security</Trans>,
      subtitle: <Trans>Biometric Hardware Verification Active</Trans>,
    },
    {
      icon: 'sync_alt',
      title: <Trans>Partnership Sync</Trans>,
      subtitle: <Trans>Active Link: Jordan J.</Trans>,
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-headline text-2xl font-bold text-primary">
          <Trans>Account Preferences</Trans>
        </h2>
        <button
          type="button"
          className="text-sm font-medium text-secondary hover:underline cursor-pointer flex items-center space-x-1"
        >
          <Trans>Restore Defaults</Trans>
          <Icon name="settings_backup_restore" className="text-base" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {preferences.map((pref) => (
          <button
            key={pref.icon}
            type="button"
            className="flex items-center space-x-4 p-4 w-full rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer text-left shadow-sm"
          >
            <IconBox icon={pref.icon} size="md" shape="circle" tone="surface" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary">{pref.title}</p>
              <p className="text-xs text-on-surface-variant">{pref.subtitle}</p>
            </div>
            <Icon name="chevron_right" className="text-xl text-outline" />
          </button>
        ))}
        <button
          type="button"
          className="flex items-center justify-center space-x-2 p-4 w-full rounded-2xl bg-surface-container hover:bg-error/5 transition-colors cursor-pointer text-error font-bold"
        >
          <Icon name="logout" className="text-xl" />
          <span>
            <Trans>Secure Logout</Trans>
          </span>
        </button>
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
            <Trans>Institutional Standard</Trans>
          </p>
          <p className="font-headline text-lg font-bold text-primary">
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
      <div className="flex items-start justify-between mb-8">
        <h1 className="font-headline text-3xl font-bold text-primary tracking-tight">
          <Trans>User Profile</Trans>
        </h1>
        <div className="flex items-center space-x-3">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <ProfileHero />
        </div>
        <div>
          <PortfolioSynergyCard />
        </div>
      </div>

      <AccountPreferences />
      <ArchitectureFooter />
    </div>
  );
}
