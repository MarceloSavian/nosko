import { Trans } from '@lingui/react/macro';
import { Link, Navigate, Outlet, useMatchRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Icon } from '@/presentation/components/Icon';
import { useAuth } from '@/presentation/contexts/AuthContext';
import { cn } from '@/presentation/lib/cn';

const navItems = [
  { to: '/dashboard' as const, icon: 'dashboard', labelKey: 'Dashboard' },
  { to: '/accounts' as const, icon: 'account_balance_wallet', labelKey: 'Joint Accounts' },
  { to: '/planner' as const, icon: 'savings', labelKey: 'Savings Goals' },
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
        'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-all',
        active ? 'bg-white/10 text-secondary' : 'text-slate-300 hover:text-white hover:bg-white/5',
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
    case 'Joint Accounts':
      return <Trans>Joint Accounts</Trans>;
    case 'Savings Goals':
      return <Trans>Savings Goals</Trans>;
    case 'Profile':
      return <Trans>Profile</Trans>;
    default:
      return labelKey;
  }
}

export function AppLayout() {
  const matchRoute = useMatchRoute();
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-72 bg-primary shadow-2xl flex flex-col p-6 shrink-0 font-headline font-bold tracking-tight">
        <div className="mb-10 px-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-secondary flex items-center justify-center rounded-lg">
              <Icon name="trending_up" filled className="text-primary text-xl" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tighter">Nosko</span>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-4 pl-0">
            <Trans>Joint Wealth Management</Trans>
          </p>
        </div>

        <nav className="space-y-2 flex-1">
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

        <div className="space-y-2 mt-auto pt-6">
          <button
            type="button"
            className="w-full mb-6 py-3 bg-secondary text-primary rounded-xl font-extrabold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Trans>Add Transaction</Trans>
          </button>

          <button
            type="button"
            className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:text-white transition-all w-full cursor-pointer"
          >
            <Icon name="help" className="text-xl" />
            <span>
              <Trans>Help Center</Trans>
            </span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:text-white transition-all w-full cursor-pointer"
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
