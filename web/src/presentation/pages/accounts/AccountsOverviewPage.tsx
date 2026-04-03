import { Trans } from '@lingui/react/macro';
import { Avatar } from '@/presentation/components/Avatar';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';

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

function NetWorthHero() {
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
          $2,842,190.42
        </p>
      </div>
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-secondary-container/20 to-transparent pointer-events-none rounded-[2rem]" />
      <div className="relative z-10 grid grid-cols-3 gap-8 pt-8 border-t border-surface-container-highest">
        <div>
          <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">
            <Trans>Liquid Assets</Trans>
          </p>
          <p className="text-xl font-bold text-primary">$842,000</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">
            <Trans>Investments</Trans>
          </p>
          <p className="text-xl font-bold text-primary">$1,650,190</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">
            <Trans>Real Estate</Trans>
          </p>
          <p className="text-xl font-bold text-primary">$350,000</p>
        </div>
      </div>
    </Card>
  );
}

function MarketInsightsCard() {
  return (
    <Card variant="dark" padding="lg" className="col-span-12 lg:col-span-4 flex flex-col">
      <h3 className="text-lg font-bold font-headline mb-6">
        <Trans>Market Insights</Trans>
      </h3>
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Icon name="rocket_launch" className="text-secondary" />
          </div>
          <div>
            <p className="text-sm font-bold">
              <Trans>Yield Optimization</Trans>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              <Trans>Transfer $42k from Chase to Savings for 4.5% APY increase.</Trans>
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Icon name="warning" className="text-tertiary-fixed" />
          </div>
          <div>
            <p className="text-sm font-bold">
              <Trans>Tax Exposure</Trans>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              <Trans>Upcoming dividend distributions may trigger capital gains.</Trans>
            </p>
          </div>
        </div>
      </div>
      <div className="mt-auto pt-8">
        <button
          type="button"
          className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20 text-white cursor-pointer hover:bg-white/20 transition-colors"
        >
          <Trans>View Detail Analysis</Trans>
        </button>
      </div>
    </Card>
  );
}

const accounts = [
  {
    icon: 'account_balance',
    iconBg: 'bg-surface-container-high',
    iconColor: 'text-primary',
    bank: 'Chase Bank',
    name: 'Premier Platinum',
    balance: '$142,500.00',
    footer: 'Synced 2m ago',
  },
  {
    icon: 'payments',
    iconBg: 'bg-tertiary-container/20',
    iconColor: 'text-tertiary',
    bank: 'Revolut',
    name: 'Global Business',
    balance: '$86,210.15',
    footer: 'Synced 5m ago',
  },
  {
    icon: 'savings',
    iconBg: 'bg-secondary-container/30',
    iconColor: 'text-secondary',
    bank: 'HSBC UK',
    name: 'Private Wealth',
    balance: '£612,900.00',
    footer: 'Updated 1hr ago',
  },
];

function ConnectedAccounts() {
  return (
    <>
      <div className="col-span-12 mt-4">
        <h3 className="text-xl font-bold font-headline text-primary">
          <Trans>Connected Accounts</Trans>
        </h3>
      </div>
      {accounts.map((account) => (
        <Card
          key={account.name}
          variant="default"
          padding="md"
          className="col-span-12 md:col-span-4 hover:shadow-md transition-shadow group cursor-pointer"
        >
          <div className="flex justify-between items-start mb-8">
            <div
              className={`h-12 w-12 rounded-2xl ${account.iconBg} flex items-center justify-center`}
            >
              <Icon name={account.icon} className={`${account.iconColor} text-3xl`} />
            </div>
            <Icon
              name="arrow_outward"
              className="text-primary/20 group-hover:text-primary transition-colors"
            />
          </div>
          <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">
            {account.bank}
          </p>
          <p className="text-lg font-bold text-primary mb-4">{account.name}</p>
          <p className="text-2xl font-extrabold font-headline tracking-tight text-primary">
            {account.balance}
          </p>
          <div className="mt-6 pt-4 border-t border-surface-container-highest flex justify-between items-center">
            <span className="text-[10px] font-medium text-primary/60">{account.footer}</span>
          </div>
        </Card>
      ))}
    </>
  );
}

const recentActivity = [
  {
    icon: 'store',
    name: 'Apple Store Manhattan',
    amount: '-$1,299.00',
    detail: 'ELECTRONICS · 1h ago',
  },
  {
    icon: 'trending_up',
    name: 'Inbound Dividend Payment',
    amount: '+$4,250.40',
    detail: 'INVESTMENT · Yesterday',
  },
  {
    icon: 'restaurant',
    name: 'The French Laundry',
    amount: '-$850.00',
    detail: 'DINING · 2 days ago',
  },
];

function RecentActivity() {
  return (
    <Card variant="default" padding="lg" className="col-span-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold font-headline text-primary">
          <Trans>Recent Activity</Trans>
        </h3>
        <button
          type="button"
          className="text-sm font-medium text-secondary hover:underline cursor-pointer flex items-center space-x-1"
        >
          <span>
            <Trans>View All Transactions</Trans>
          </span>
          <Icon name="chevron_right" className="text-base" />
        </button>
      </div>
      <div className="space-y-5">
        {recentActivity.map((item) => (
          <div key={item.name} className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
              <Icon name={item.icon} className="text-primary text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-primary">{item.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-outline">{item.detail}</p>
            </div>
            <p
              className={`font-bold text-sm shrink-0 ${item.amount.startsWith('+') ? 'text-tertiary' : 'text-primary'}`}
            >
              {item.amount}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AccountsOverviewPage() {
  return (
    <div>
      <TopBar />
      <div className="px-10 pb-12 pt-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-widest text-primary/60 mb-1">
              <Trans>Welcome back</Trans>
            </p>
            <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-primary">
              <Trans>Nosko Overview</Trans>
            </h2>
          </div>
          <div className="bg-surface-container-high p-1 rounded-2xl flex gap-1">
            <button
              type="button"
              className="px-4 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              USD
            </button>
            <button
              type="button"
              className="px-4 py-1.5 text-primary/60 hover:bg-white/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              EUR
            </button>
            <button
              type="button"
              className="px-4 py-1.5 text-primary/60 hover:bg-white/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              GBP
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <NetWorthHero />
          <MarketInsightsCard />
          <ConnectedAccounts />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
