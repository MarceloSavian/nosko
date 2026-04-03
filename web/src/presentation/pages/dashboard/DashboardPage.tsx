import { Trans } from '@lingui/react/macro';
import { Avatar } from '@/presentation/components/Avatar';
import { Badge } from '@/presentation/components/Badge';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { PageHeader } from '@/presentation/components/PageHeader';
import { ProgressBar } from '@/presentation/components/ProgressBar';
import { SectionHeader } from '@/presentation/components/SectionHeader';

function BalanceCard() {
  return (
    <Card variant="hero" padding="lg" className="flex-1">
      <p className="text-xs font-bold uppercase tracking-widest text-on-primary-container mb-4">
        <Trans>Total Combined Balance</Trans>
      </p>
      <div className="flex items-baseline space-x-1 mb-6">
        <span className="text-5xl font-headline font-bold">€42,890</span>
        <span className="text-2xl font-headline text-on-primary-container">.45</span>
      </div>
      <Badge variant="success" size="md" className="mb-6 space-x-1">
        <Icon name="trending_up" className="text-sm" />
        <span>
          <Trans>Growing +4.2%</Trans>
        </span>
      </Badge>
      <div className="grid grid-cols-2 gap-3">
        <Card variant="glass" padding="sm" className="rounded-xl">
          <p className="text-[10px] uppercase tracking-wider text-on-primary-container mb-1">
            <Trans>Savings Pool</Trans>
          </p>
          <p className="text-xl font-bold">€28,400</p>
        </Card>
        <Card variant="glass" padding="sm" className="rounded-xl">
          <p className="text-[10px] uppercase tracking-wider text-on-primary-container mb-1">
            <Trans>Checking stream</Trans>
          </p>
          <p className="text-xl font-bold">€14,490</p>
        </Card>
      </div>
    </Card>
  );
}

function GoalCard() {
  return (
    <Card variant="default" padding="md" className="w-72 shrink-0">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="favorite" filled className="text-error text-sm" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <Trans>Dream Home Goal</Trans>
        </p>
      </div>
      <h3 className="font-headline text-xl font-bold text-on-surface mb-3">
        <Trans>Summer House in Porvoo</Trans>
      </h3>
      <div className="flex items-baseline space-x-2 mb-2">
        <span className="text-sm font-bold text-on-surface">€125,000</span>
        <span className="text-xs text-outline">/ €250k</span>
        <span className="text-xs font-bold text-secondary ml-auto">
          <Trans>50% Achieved</Trans>
        </span>
      </div>
      <ProgressBar value={50} size="lg" className="mb-4" />
      <div className="flex items-center space-x-2 text-xs text-on-surface-variant">
        <Icon name="group" className="text-sm" />
        <span>
          <Trans>Active Joint Effort</Trans>
        </span>
      </div>
    </Card>
  );
}

const trajectoryItems = [
  {
    icon: 'home',
    labelKey: 'Rent & Mortgage',
    descKey: 'Automatic debit scheduled',
    amount: '€1,850',
    total: '€1,850',
    value: 100,
  },
  {
    icon: 'restaurant',
    labelKey: 'Dining & Groceries',
    descKey: 'High frequency this week',
    amount: '€642',
    total: '€800',
    value: 80,
  },
  {
    icon: 'bolt',
    labelKey: 'Utility Bills',
    descKey: 'Electricity & Water',
    amount: '€210',
    total: '€350',
    value: 60,
  },
];

function TrajectoryLabel({ labelKey }: { labelKey: string }) {
  switch (labelKey) {
    case 'Rent & Mortgage':
      return <Trans>Rent &amp; Mortgage</Trans>;
    case 'Dining & Groceries':
      return <Trans>Dining &amp; Groceries</Trans>;
    case 'Utility Bills':
      return <Trans>Utility Bills</Trans>;
    default:
      return labelKey;
  }
}

function TrajectoryDescription({ descKey }: { descKey: string }) {
  switch (descKey) {
    case 'Automatic debit scheduled':
      return <Trans>Automatic debit scheduled</Trans>;
    case 'High frequency this week':
      return <Trans>High frequency this week</Trans>;
    case 'Electricity & Water':
      return <Trans>Electricity &amp; Water</Trans>;
    default:
      return descKey;
  }
}

function MonthlyTrajectory() {
  return (
    <section>
      <SectionHeader
        title={<Trans>Monthly Trajectory</Trans>}
        action={
          <button
            type="button"
            className="text-sm font-medium text-on-surface-variant hover:text-secondary transition-colors cursor-pointer flex items-center space-x-1"
          >
            <span>
              <Trans>Adjust Limits</Trans>
            </span>
            <Icon name="chevron_right" className="text-base" />
          </button>
        }
      />
      <div className="space-y-6">
        {trajectoryItems.map((item) => (
          <div key={item.labelKey} className="flex items-center space-x-4">
            <IconBox icon={item.icon} size="md" tone="surface" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm text-on-surface">
                  <TrajectoryLabel labelKey={item.labelKey} />
                </p>
                <div className="text-right">
                  <span className="font-bold text-sm text-on-surface">{item.amount}</span>
                  <span className="text-xs text-outline ml-2">
                    <Trans>of {item.total}</Trans>
                  </span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mb-2">
                <TrajectoryDescription descKey={item.descKey} />
              </p>
              <ProgressBar value={item.value} size="md" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const ledgerItems = [
  {
    icon: 'store',
    name: 'Artek Helsinki',
    category: 'HOME & DECOR',
    amount: '-€124.00',
    time: 'Just',
    tag: 'Joint',
  },
  {
    icon: 'train',
    name: 'VR Railways',
    category: 'TRAVEL',
    amount: '-€42.50',
    time: 'Today, 10:45',
    tag: '',
  },
  {
    icon: 'coffee',
    name: 'Kaffa Roastery',
    category: 'LIFESTYLE',
    amount: '-€8.20',
    time: 'Yesterday',
    tag: '',
  },
  {
    icon: 'shopping_bag',
    name: 'Stockmann Oyj',
    category: 'CLOTHING',
    amount: '-€215.00',
    time: 'Sep. 10',
    tag: '',
  },
];

function ActivityLedger() {
  return (
    <Card variant="default" padding="md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline text-lg font-bold text-on-surface">
          <Trans>Activity Ledger</Trans>
        </h3>
        <button type="button" className="cursor-pointer">
          <Icon
            name="sync"
            className="text-xl text-on-surface-variant hover:text-secondary transition-colors"
          />
        </button>
      </div>
      <div className="space-y-5">
        {ledgerItems.map((item) => (
          <div key={item.name} className="flex items-start space-x-3">
            <IconBox icon={item.icon} size="sm" shape="circle" tone="surface" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <p className="font-bold text-sm text-on-surface">{item.name}</p>
                <p className="font-bold text-sm text-on-surface shrink-0 ml-2">{item.amount}</p>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase tracking-wider text-outline">
                    {item.category}
                  </span>
                  {item.tag && (
                    <Badge variant="success" size="sm">
                      {item.tag}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-outline">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="ghost" size="md" fullWidth className="mt-6 space-x-2">
        <span>
          <Trans>Export Ledger (PDF)</Trans>
        </span>
        <Icon name="download" className="text-base" />
      </Button>
    </Card>
  );
}

export function DashboardPage() {
  return (
    <div className="p-8">
      <PageHeader
        overline={<Trans>Overview</Trans>}
        title={<Trans>Financial Narrative</Trans>}
        actions={
          <>
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-colors"
            >
              <Icon name="notifications" className="text-xl text-on-surface-variant" />
            </button>
            <Avatar size="md" />
          </>
        }
      />

      <div className="flex gap-6 mb-10">
        <BalanceCard />
        <GoalCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <MonthlyTrajectory />
        </div>
        <div className="lg:col-span-2">
          <ActivityLedger />
        </div>
      </div>
    </div>
  );
}
