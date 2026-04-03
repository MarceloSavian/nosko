import { Trans } from '@lingui/react/macro';
import { Link, Outlet, useMatchRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Button } from '@/presentation/components/Button';
import { Icon } from '@/presentation/components/Icon';
import { Logo } from '@/presentation/components/Logo';
import { cn } from '@/presentation/lib/cn';

const navItems = [
  { to: '/dashboard' as const, icon: 'dashboard', labelKey: 'Dashboard' },
  { to: '/accounts' as const, icon: 'account_balance_wallet', labelKey: 'Accounts' },
  { to: '/planner' as const, icon: 'event_note', labelKey: 'Planner' },
  { to: '/profile' as const, icon: 'person', labelKey: 'Profile' },
];

type NavItemProps = {
  to: string;
  icon: string;
  children: ReactNode;
  active: boolean;
};

function NavItem({ to, icon, children, active }: NavItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
        active
          ? 'text-secondary bg-secondary/5 font-bold'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low',
      )}
    >
      <Icon name={icon} filled={active} className="text-xl" />
      <span>{children}</span>
    </Link>
  );
}

function NavItemLabel({ labelKey }: { labelKey: string }) {
  switch (labelKey) {
    case 'Dashboard':
      return <Trans>Dashboard</Trans>;
    case 'Accounts':
      return <Trans>Accounts</Trans>;
    case 'Planner':
      return <Trans>Planner</Trans>;
    case 'Profile':
      return <Trans>Profile</Trans>;
    default:
      return labelKey;
  }
}

export function AppLayout() {
  const matchRoute = useMatchRoute();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/10 flex flex-col p-6 shrink-0">
        <div className="mb-10">
          <Logo size="sm" />
          <p className="text-[10px] text-outline uppercase tracking-widest mt-1 pl-9">
            <Trans>Unity Ledger</Trans>
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              active={!!matchRoute({ to: item.to, fuzzy: true })}
            >
              <NavItemLabel labelKey={item.labelKey} />
            </NavItem>
          ))}
        </nav>

        <div className="space-y-2 mt-auto">
          <Button type="button" variant="primary" size="md" fullWidth className="space-x-2 mb-4">
            <Icon name="add" className="text-lg" />
            <span>
              <Trans>Add Transaction</Trans>
            </span>
          </Button>

          <button
            type="button"
            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors w-full cursor-pointer"
          >
            <Icon name="help_outline" className="text-xl" />
            <span>
              <Trans>Support</Trans>
            </span>
          </button>

          <button
            type="button"
            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-on-surface-variant hover:text-error transition-colors w-full cursor-pointer"
          >
            <Icon name="logout" className="text-xl" />
            <span>
              <Trans>Sign Out</Trans>
            </span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
