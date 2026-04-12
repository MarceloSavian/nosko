import { Trans } from '@lingui/react/macro';
import { Link, Outlet, useMatchRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/presentation/contexts/AuthContext';
import { cn } from '@/presentation/lib/cn';
import { Icon } from './Icon';

const navItems = [
  { to: '/customers', icon: 'people', label: 'Customers' },
  { to: '/institutions', icon: 'account_balance', label: 'Institutions' },
  { to: '/budget-categories', icon: 'category', label: 'Categories' },
  { to: '/admins', icon: 'admin_panel_settings', label: 'Admins' },
] as const;

export function AdminLayout() {
  const { isAuthenticated, logout } = useAuth();
  const matchRoute = useMatchRoute();
  const [collapsed, setCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <meta httpEquiv="refresh" content="0;url=/login" />;
  }

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          'flex flex-col bg-primary text-on-primary transition-all duration-300',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-on-primary/10">
          {!collapsed && (
            <span className="font-headline font-bold text-lg">
              <Trans>Nosko Admin</Trans>
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-on-primary/10 rounded-lg cursor-pointer"
          >
            <Icon name={collapsed ? 'menu_open' : 'menu'} className="text-on-primary" />
          </button>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const isActive = matchRoute({ to: item.to, fuzzy: true });
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-on-primary/15 text-on-primary font-semibold'
                    : 'text-on-primary/70 hover:bg-on-primary/10',
                )}
              >
                <Icon name={item.icon} filled={!!isActive} />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-on-primary/10">
          <button
            type="button"
            onClick={logout}
            className={cn(
              'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-on-primary/70 hover:bg-on-primary/10 transition-all duration-200 cursor-pointer',
            )}
          >
            <Icon name="logout" />
            {!collapsed && (
              <span className="text-sm">
                <Trans>Logout</Trans>
              </span>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
