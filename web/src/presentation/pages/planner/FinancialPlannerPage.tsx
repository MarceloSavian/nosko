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
            placeholder="Search transactions..."
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
          <Avatar size="md" />
        </div>
      </div>
    </header>
  );
}

function JointPlanningSection() {
  return (
    <Card variant="default" padding="lg" className="flex-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon name="handshake" className="text-primary text-xl" />
          <h3 className="font-headline text-lg font-bold text-primary">
            <Trans>Joint Planning</Trans>
          </h3>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center space-x-4">
          <IconBox icon="home" size="md" tone="surface" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-bold text-sm text-primary">
                <Trans>Monthly Rent</Trans>
              </p>
              <p className="font-bold text-primary">$2,450.00</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">
                <Trans>Due in 4 days</Trans>
              </p>
              <p className="text-xs text-outline">
                <Trans>Split 50/50</Trans>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <IconBox icon="bolt" size="md" tone="surface" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-bold text-sm text-primary">
                <Trans>Energy &amp; Utilities</Trans>
              </p>
              <p className="font-bold text-primary">$184.20</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">
                <Trans>Paid &ndash; Oct 12</Trans>
              </p>
              <p className="text-xs text-outline italic">
                <Trans>Auto-synced</Trans>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <IconBox icon="wifi" size="md" tone="surface" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <p className="font-bold text-sm text-primary">
                <Trans>Fiber Internet</Trans>
              </p>
              <p className="font-bold text-primary">$85.00</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">
                <Trans>Scheduled &ndash; Oct 28</Trans>
              </p>
              <p className="text-xs text-outline">
                <Trans>Shared Account</Trans>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-surface-container-highest flex items-center justify-between">
        <p className="text-sm text-on-surface-variant italic">
          <Trans>Total Joint Responsibility</Trans>
        </p>
        <p className="text-2xl font-extrabold font-headline tracking-tighter text-primary">
          $2,719.20
        </p>
      </div>
    </Card>
  );
}

function SpendingSection() {
  const items = [
    { icon: 'fitness_center', name: 'Equinox Membership', amount: '$195.00' },
    { icon: 'palette', name: 'Art Supplies (Blick)', amount: '$64.30' },
    { icon: 'restaurant', name: 'Dinner – Blue Hill', amount: '$320.12' },
  ];

  return (
    <div className="w-80 shrink-0 space-y-4">
      <Card variant="default" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-bold text-primary">
            <Trans>Your Spending</Trans>
          </h3>
          <button
            type="button"
            className="text-[10px] font-bold text-secondary uppercase tracking-widest cursor-pointer"
          >
            <Trans>View All</Trans>
          </button>
        </div>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.name} className="flex items-center space-x-3">
              <IconBox icon={item.icon} size="sm" shape="circle" tone="surface" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-primary">{item.name}</p>
              </div>
              <p className="font-bold text-sm text-primary shrink-0">{item.amount}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-surface-container-highest">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">
              <Trans>Budget Utilization</Trans>
            </p>
            <p className="text-sm font-bold text-tertiary">72%</p>
          </div>
          <ProgressBar value={72} size="md" color="primary" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card variant="default" padding="md" className="bg-tertiary-container/30">
          <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">
            <Trans>Saved This Month</Trans>
          </p>
          <p className="text-xl font-extrabold font-headline tracking-tight text-primary">
            $1,102.50
          </p>
        </Card>
        <Card variant="default" padding="md" className="bg-secondary-container/30">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">
            <Trans>Oct Month Trend</Trans>
          </p>
          <p className="text-xl font-extrabold font-headline tracking-tight text-primary">
            +4.2% <Icon name="trending_up" className="text-sm text-secondary" />
          </p>
        </Card>
      </div>
    </div>
  );
}

function CashFlowSection() {
  return (
    <Card variant="default" padding="lg" className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-headline text-xl font-bold text-primary">
            <Trans>Cash Flow Analysis</Trans>
          </h3>
          <p className="text-sm text-on-surface-variant">
            <Trans>
              Visualizing your income vs joint and personal expenses over the last 30 days.
            </Trans>
          </p>
        </div>
        <div className="bg-surface-container-high p-1 rounded-2xl flex gap-1">
          <button
            type="button"
            className="px-4 py-1.5 text-primary/60 hover:bg-white/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Trans>Weekly</Trans>
          </button>
          <button
            type="button"
            className="px-4 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
          >
            <Trans>Monthly</Trans>
          </button>
        </div>
      </div>
      <div className="h-48 flex items-end gap-4 mb-6">
        {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week) => (
          <div key={week} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex gap-1 items-end h-40">
              <div className="flex-1 bg-primary/15 rounded-t-lg h-[60%]" />
              <div className="flex-1 bg-secondary/30 rounded-t-lg h-[40%]" />
              <div className="flex-1 bg-tertiary/20 rounded-t-lg h-[25%]" />
            </div>
            <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">
              {week}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary/15" />
          <span className="text-xs text-on-surface-variant">
            <Trans>Joint Expenses</Trans>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-secondary/30" />
          <span className="text-xs text-on-surface-variant">
            <Trans>Personal Growth</Trans>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-tertiary/20" />
          <span className="text-xs text-on-surface-variant">
            <Trans>Portfolio Reinvestment</Trans>
          </span>
        </div>
      </div>
    </Card>
  );
}

export function FinancialPlannerPage() {
  return (
    <div>
      <TopBar />
      <div className="px-10 pb-12 pt-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-primary">
              <Trans>Your Payments This Month</Trans>
            </h2>
            <p className="text-on-surface-variant mt-1">
              <Trans>
                Tracking shared liquidity and individual growth for Nosko &amp; Partner.
              </Trans>
            </p>
          </div>
          <Card variant="default" padding="md" className="bg-secondary-container/30 rounded-2xl">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">
              <Trans>Monthly Growth</Trans>
            </p>
            <p className="text-2xl font-extrabold font-headline tracking-tighter text-primary">
              +12.4%
            </p>
          </Card>
        </div>

        <div className="flex gap-8">
          <JointPlanningSection />
          <SpendingSection />
        </div>

        <CashFlowSection />
      </div>
    </div>
  );
}
