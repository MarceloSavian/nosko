import { Trans } from '@lingui/react/macro';
import { Badge } from '@/presentation/components/Badge';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { PageHeader } from '@/presentation/components/PageHeader';
import { ProgressBar } from '@/presentation/components/ProgressBar';
import { SectionHeader } from '@/presentation/components/SectionHeader';

function NetWorthHero() {
  return (
    <Card variant="hero" padding="lg" className="flex-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-primary-container mb-4">
        <Trans>Total Net Worth (Combined)</Trans>
      </p>
      <p className="text-5xl font-headline font-bold mb-4">$142,890.45</p>
      <Badge variant="success" size="md" className="mb-6 space-x-1">
        <Icon name="trending_up" className="text-sm" />
        <span>
          <Trans>+2.4% this month</Trans>
        </span>
      </Badge>
      <p className="text-xs text-on-primary-container mb-1">
        <Trans>Updated 12 mins ago</Trans>
      </p>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-on-primary-container">
            <Trans>Annual Savings Goal</Trans>
          </p>
          <p className="text-xs font-bold text-white">
            <Trans>72% Reached</Trans>
          </p>
        </div>
        <ProgressBar value={72} size="lg" color="gradient" trackClassName="bg-white/20" />
        <div className="flex items-center space-x-3 mt-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            <span className="text-[10px] text-on-primary-container">
              <Trans>ALEX</Trans>
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
            <span className="text-[10px] text-on-primary-container">
              <Trans>JORDAN</Trans>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CurrencyCards() {
  return (
    <div className="flex flex-col gap-3 w-44 shrink-0">
      <Card variant="outlined" padding="sm" className="rounded-2xl">
        <p className="text-xs font-bold text-secondary uppercase tracking-wider">USD</p>
        <p className="text-[10px] text-on-surface-variant mt-1">
          <Trans>US Dollar</Trans>
        </p>
        <p className="text-xl font-headline font-bold text-on-surface mt-2">$82,400</p>
      </Card>
      <Card variant="outlined" padding="sm" className="rounded-2xl">
        <p className="text-xs font-bold text-tertiary uppercase tracking-wider">GBP</p>
        <p className="text-[10px] text-on-surface-variant mt-1">
          <Trans>Pound Sterling</Trans>
        </p>
        <p className="text-xl font-headline font-bold text-on-surface mt-2">£34,120</p>
      </Card>
    </div>
  );
}

function CollaborativeCashCard() {
  return (
    <Card padding="md" className="bg-tertiary rounded-2xl text-white w-44 shrink-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-tertiary-fixed-dim mb-2">
        <Trans>Collaborative Cash</Trans>
      </p>
      <p className="text-2xl font-headline font-bold">€12,500</p>
      <div className="flex justify-end mt-4">
        <IconBox
          icon="group"
          size="sm"
          shape="circle"
          className="bg-white/20"
          iconClassName="text-white"
        />
      </div>
    </Card>
  );
}

const institutions = [
  {
    initial: 'C',
    color: 'bg-primary',
    name: 'Chase Sapphire Checking',
    detail: '••••4421',
    balanceLabel: 'AVAILABLE BALANCE',
    balance: '$42,109.20',
    change: '+12% YoY',
    footer: 'Primary US Account',
    tag: '',
  },
  {
    initial: 'G',
    color: 'bg-on-surface',
    name: 'Revolut Premium',
    detail: 'Multi-currency (EUR/USD)',
    balanceLabel: 'TOTAL VALUE',
    balance: '€18,440.00',
    change: '',
    footer: '12 Transactions this week',
    tag: 'SHARED',
  },
  {
    initial: 'H',
    color: 'bg-error',
    name: 'HSBC Premier UK',
    detail: '••••9901',
    balanceLabel: 'CURRENT BALANCE',
    balance: '£34,120.50',
    change: '',
    footer: 'Updated yesterday',
    tag: 'International',
  },
];

function InstitutionCard({ institution }: { institution: (typeof institutions)[number] }) {
  return (
    <Card variant="default" padding="md">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 ${institution.color} rounded-xl flex items-center justify-center text-white font-bold text-sm`}
        >
          {institution.initial}
        </div>
        <button type="button" className="cursor-pointer">
          <Icon name="more_vert" className="text-xl text-outline" />
        </button>
      </div>
      <h3 className="font-bold text-on-surface mb-1">{institution.name}</h3>
      <p className="text-xs text-on-surface-variant mb-4">{institution.detail}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
        {institution.balanceLabel}
      </p>
      <div className="flex items-baseline space-x-2">
        <p className="text-2xl font-headline font-bold text-on-surface">{institution.balance}</p>
        {institution.tag && (
          <Badge variant="success" size="sm">
            {institution.tag}
          </Badge>
        )}
      </div>
      {institution.change && (
        <p className="text-xs text-secondary font-bold mt-1">{institution.change}</p>
      )}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
        <span className="text-xs text-secondary font-medium">{institution.footer}</span>
        <Icon name="arrow_forward" className="text-base text-outline" />
      </div>
    </Card>
  );
}

function RecommendationBanner() {
  return (
    <Card padding="lg" className="bg-tertiary-fixed/30 rounded-3xl mt-8">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-8">
          <h3 className="font-headline text-xl font-bold text-on-surface mb-2">
            <Trans>Maximize Your Joint Portfolio</Trans>
          </h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            <Trans>
              Financial Harmony has detected that transferring £5,000 to your high-yield savings
              could net you an extra $240 in interest annually.
            </Trans>
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Button type="button" variant="primary" size="md">
            <Trans>Explore Opportunities</Trans>
          </Button>
          <Button type="button" variant="ghost" size="md">
            <Trans>Dismiss</Trans>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function AccountsOverviewPage() {
  return (
    <div className="p-8">
      <PageHeader
        title={<Trans>Accounts Overview</Trans>}
        subtitle={<Trans>Your global liquidity at a glance.</Trans>}
        actions={
          <>
            <Badge variant="success" size="md" className="space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>
                <Trans>3 Active Connections</Trans>
              </span>
            </Badge>
            <button type="button" className="cursor-pointer">
              <Icon
                name="sync"
                className="text-xl text-on-surface-variant hover:text-secondary transition-colors"
              />
            </button>
          </>
        }
      />

      <div className="flex gap-4 mb-10">
        <NetWorthHero />
        <div className="flex flex-col gap-4">
          <CurrencyCards />
        </div>
        <CollaborativeCashCard />
      </div>

      <SectionHeader title={<Trans>Connected Institutions</Trans>} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {institutions.map((inst) => (
          <InstitutionCard key={inst.name} institution={inst} />
        ))}
      </div>

      <RecommendationBanner />
    </div>
  );
}
