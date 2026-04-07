import { Trans } from '@lingui/react/macro';
import { Link, Navigate, Outlet, useMatchRoute } from '@tanstack/react-router';
import { type ReactNode, useState } from 'react';
import { Icon } from '@/presentation/components/Icon';
import { useAuth } from '@/presentation/contexts/AuthContext';
import { cn } from '@/presentation/lib/cn';

const navItems = [
  { to: '/dashboard' as const, icon: 'dashboard', labelKey: 'Dashboard' },
  { to: '/accounts' as const, icon: 'account_balance_wallet', labelKey: 'Joint Accounts' },
  { to: '/transactions' as const, icon: 'receipt_long', labelKey: 'Transactions' },
  { to: '/planner' as const, icon: 'savings', labelKey: 'Savings Goals' },
  { to: '/profile' as const, icon: 'person', labelKey: 'Profile' },
];

type NavItemProps = {
  to: string;
  icon: string;
  children: ReactNode;
  active: boolean;
  collapsed: boolean;
};

function NavItem({ to, icon, children, active, collapsed }: NavItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center rounded-xl text-sm font-bold transition-all',
        collapsed ? 'justify-center px-3 py-3' : 'space-x-3 px-4 py-3',
        active ? 'bg-white/10 text-secondary' : 'text-slate-300 hover:text-white hover:bg-white/5',
      )}
    >
      <Icon name={icon} filled={active} className="text-xl shrink-0" />
      {!collapsed && <span>{children}</span>}
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
    case 'Transactions':
      return <Trans>Transactions</Trans>;
    case 'Profile':
      return <Trans>Profile</Trans>;
    default:
      return labelKey;
  }
}

export function AppLayout() {
  const matchRoute = useMatchRoute();
  const { isAuthenticated, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          'bg-primary shadow-2xl flex flex-col shrink-0 font-headline font-bold tracking-tight transition-all duration-300',
          collapsed ? 'w-20 p-4' : 'w-72 p-6',
        )}
      >
        <div className={cn('mb-10', collapsed ? 'px-0' : 'px-2')}>
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'space-x-2')}>
            <div className="w-8 h-8 bg-secondary flex items-center justify-center rounded-lg shrink-0">
              <Icon name="trending_up" filled className="text-primary text-xl" />
            </div>
            {!collapsed && (
              <span className="text-2xl font-extrabold text-white tracking-tighter">Nosko</span>
            )}
          </div>
          {!collapsed && (
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-4 pl-0">
              <Trans>Joint Wealth Management</Trans>
            </p>
          )}
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              active={!!matchRoute({ to: item.to, fuzzy: true })}
              collapsed={collapsed}
            >
              <NavItemLabel labelKey={item.labelKey} />
            </NavItem>
          ))}
        </nav>

        <div className="space-y-2 mt-auto pt-6">
          {collapsed ? (
            <button
              type="button"
              className="w-full mb-6 py-3 bg-secondary text-primary rounded-xl font-extrabold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
            >
              <Icon name="add" filled className="text-xl" />
            </button>
          ) : (
            <button
              type="button"
              className="w-full mb-6 py-3 bg-secondary text-primary rounded-xl font-extrabold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Trans>Add Transaction</Trans>
            </button>
          )}

          {!collapsed && (
            <button
              type="button"
              className="flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:text-white transition-all w-full cursor-pointer"
            >
              <Icon name="help" className="text-xl shrink-0" />
              <span>
                <Trans>Help Center</Trans>
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            className={cn(
              'flex items-center text-sm text-slate-300 hover:text-white transition-all w-full cursor-pointer',
              collapsed ? 'justify-center px-3 py-2' : 'space-x-3 px-4 py-2',
            )}
          >
            <Icon name="logout" className="text-xl shrink-0" />
            {!collapsed && (
              <span>
                <Trans>Sign Out</Trans>
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className={cn(
              'flex items-center text-sm text-slate-300 hover:text-white transition-all w-full cursor-pointer',
              collapsed ? 'justify-center px-3 py-2' : 'space-x-3 px-4 py-2',
            )}
          >
            <Icon
              name={collapsed ? 'chevron_right' : 'chevron_left'}
              className="text-xl shrink-0"
            />
            {!collapsed && (
              <span>
                <Trans>Collapse</Trans>
              </span>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
