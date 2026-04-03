import { Trans } from '@lingui/react/macro';
import { Avatar } from '@/presentation/components/Avatar';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { ProgressBar } from '@/presentation/components/ProgressBar';

function TopBar() {
  return (
    <header className="sticky top-0 h-20 bg-background/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-10 z-40 font-headline font-extrabold tracking-tight">
      <div className="flex items-center gap-8 flex-1">
        <div className="relative w-64">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40"
          />
          <input
            type="text"
            placeholder="Search portfolios..."
            className="w-full bg-white/50 border-0 rounded-full py-2 pl-10 focus:ring-2 focus:ring-tertiary text-sm font-medium"
          />
        </div>
        <nav className="hidden lg:flex items-center gap-6">
          <span className="text-primary border-b-2 border-secondary pb-1 cursor-pointer">
            <Trans>Portfolio</Trans>
          </span>
          <span className="text-on-surface-variant hover:text-primary transition-opacity cursor-pointer">
            <Trans>Insights</Trans>
          </span>
          <span className="text-on-surface-variant hover:text-primary transition-opacity cursor-pointer">
            <Trans>Planning</Trans>
          </span>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="bg-primary text-on-primary px-5 py-2 rounded-full text-sm font-bold hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Trans>Sync Accounts</Trans>
        </button>
        <div className="flex items-center gap-4 text-primary">
          <Icon name="notifications" className="text-xl cursor-pointer hover:opacity-80" />
          <Icon name="settings" className="text-xl cursor-pointer hover:opacity-80" />
          <Avatar size="md" />
        </div>
      </div>
    </header>
  );
}

function BalanceCard() {
  return (
    <Card
      variant="hero"
      padding="xl"
      className="col-span-12 lg:col-span-8 h-[400px] flex flex-col justify-between"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-tertiary-container/30 text-tertiary text-[10px] font-bold uppercase tracking-widest rounded-full">
            <Trans>Consolidated Portfolio</Trans>
          </span>
          <span className="text-secondary flex items-center text-sm font-bold">
            <Icon name="trending_up" className="text-sm mr-1" />
            +12.4%
          </span>
        </div>
        <h3 className="text-sm font-bold text-primary/50 uppercase tracking-widest mb-2">
          <Trans>Total Net Worth</Trans>
        </h3>
        <p className="text-7xl font-extrabold font-headline tracking-tighter text-primary">
          $482,904.32
        </p>
      </div>
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-secondary-container/20 to-transparent pointer-events-none rounded-[2rem]" />
      <div className="relative z-10 grid grid-cols-3 gap-8 pt-8 border-t border-surface-container-highest">
        <div>
          <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">
            <Trans>Checking</Trans>
          </p>
          <p className="text-xl font-bold text-primary">$42k</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">
            <Trans>Savings</Trans>
          </p>
          <p className="text-xl font-bold text-primary">$310k</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">
            <Trans>Investment</Trans>
          </p>
          <p className="text-xl font-bold text-primary">$130k</p>
        </div>
      </div>
    </Card>
  );
}

function ActivityLedger() {
  const items = [
    {
      icon: 'store',
      name: 'Apple Store',
      category: 'ELECTRONICS',
      amount: '-$2,100.00',
      time: 'Today',
      positive: false,
    },
    {
      icon: 'trending_up',
      name: 'Quarterly Dividend',
      category: 'INVESTMENT',
      amount: '+$442.55',
      time: 'Yesterday',
      positive: true,
    },
    {
      icon: 'bolt',
      name: 'Consolidated Edison',
      category: 'UTILITIES',
      amount: '-$843.30',
      time: 'Sep 12',
      positive: false,
    },
    {
      icon: 'home',
      name: 'Monthly Rent',
      category: 'HOUSING',
      amount: '-$1,000.00',
      time: 'Sep 10',
      positive: false,
    },
  ];

  return (
    <Card variant="default" padding="lg" className="col-span-12 lg:col-span-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline text-lg font-bold text-primary">
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
        {items.map((item) => (
          <div key={item.name} className="flex items-start space-x-3">
            <IconBox icon={item.icon} size="sm" shape="circle" tone="surface" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <p className="font-bold text-sm text-primary">{item.name}</p>
                <p
                  className={`font-bold text-sm shrink-0 ml-2 ${item.positive ? 'text-tertiary' : 'text-primary'}`}
                >
                  {item.amount}
                </p>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] uppercase tracking-wider text-outline">
                  {item.category}
                </span>
                <span className="text-[10px] text-outline">{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const trajectoryItems = [
  {
    icon: 'home',
    labelKey: 'Rent / Mortgage',
    amount: '$3,200',
    total: '$3,200',
    value: 100,
  },
  {
    icon: 'restaurant',
    labelKey: 'Dining & Social',
    amount: '$840',
    total: '$1,000',
    value: 84,
  },
  {
    icon: 'bolt',
    labelKey: 'Utility Bills',
    amount: '$510',
    total: '$600',
    value: 85,
  },
];

function TrajectoryLabel({ labelKey }: { labelKey: string }) {
  switch (labelKey) {
    case 'Rent / Mortgage':
      return <Trans>Rent / Mortgage</Trans>;
    case 'Dining & Social':
      return <Trans>Dining &amp; Social</Trans>;
    case 'Utility Bills':
      return <Trans>Utility Bills</Trans>;
    default:
      return labelKey;
  }
}

function MonthlyTrajectory() {
  return (
    <Card variant="default" padding="lg" className="col-span-12 lg:col-span-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-headline text-xl font-bold text-primary">
          <Trans>Monthly Trajectory</Trans>
        </h2>
        <button
          type="button"
          className="text-sm font-medium text-on-surface-variant hover:text-secondary transition-colors cursor-pointer flex items-center space-x-1"
        >
          <span>
            <Trans>Adjust Limits</Trans>
          </span>
          <Icon name="chevron_right" className="text-base" />
        </button>
      </div>
      <div className="space-y-6">
        {trajectoryItems.map((item) => (
          <div key={item.labelKey} className="flex items-center space-x-4">
            <IconBox icon={item.icon} size="md" tone="surface" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm text-primary">
                  <TrajectoryLabel labelKey={item.labelKey} />
                </p>
                <div className="text-right">
                  <span className="font-bold text-sm text-primary">{item.amount}</span>
                  <span className="text-xs text-outline ml-2">
                    <Trans>of {item.total}</Trans>
                  </span>
                </div>
              </div>
              <ProgressBar value={item.value} size="md" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InsightsCard() {
  return (
    <Card variant="dark" padding="lg" className="col-span-12 lg:col-span-4">
      <h3 className="text-lg font-bold font-headline mb-6">
        <Trans>Generate Narrative Insights</Trans>
      </h3>
      <p className="text-white/60 text-sm leading-relaxed mb-8">
        <Trans>AI-powered analysis of your spending patterns and investment trajectory.</Trans>
      </p>
      <button
        type="button"
        className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20 text-white cursor-pointer hover:bg-white/20 transition-colors"
      >
        <Trans>Launch Curator</Trans>
      </button>
    </Card>
  );
}

export function DashboardPage() {
  return (
    <div>
      <TopBar />
      <div className="px-10 pb-12 pt-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-widest text-primary/60 mb-1">
              <Trans>Overview</Trans>
            </p>
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-primary">
              <Trans>Financial Narrative</Trans>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <BalanceCard />
          <ActivityLedger />
          <MonthlyTrajectory />
          <InsightsCard />
        </div>
      </div>
    </div>
  );
}
