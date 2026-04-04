import { Trans, useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useState } from 'react';
import type { DashboardData } from '@/domain/models/dashboard/Dashboard';
import type { ILoadDashboard } from '@/domain/usecases/dashboard/ILoadDashboard';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { ProgressBar } from '@/presentation/components/ProgressBar';

type Props = {
  loadDashboard: ILoadDashboard;
};

function formatCents(cents: number): string {
  const abs = Math.abs(cents);
  const formatted = (abs / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return cents < 0 ? `-$${formatted}` : `$${formatted}`;
}

function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function navigateMonth(yearMonth: string, delta: number): string {
  const parts = yearMonth.split('-').map(Number);
  const date = new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1 + delta);
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

export function DashboardPage({ loadDashboard }: Props) {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLingui();

  const fetchDashboard = useCallback(
    async (ym: string) => {
      setLoading(true);
      setError('');
      try {
        const result = await loadDashboard.execute(ym);
        setData(result);
      } catch {
        setError(t`Failed to load dashboard.`);
      } finally {
        setLoading(false);
      }
    },
    [loadDashboard, t],
  );

  useEffect(() => {
    fetchDashboard(yearMonth);
  }, [yearMonth, fetchDashboard]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Icon name="progress_activity" className="text-4xl text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-4 bg-error/10 rounded-xl text-error text-sm font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="px-10 pb-12 pt-8">
      <div className="flex justify-between items-end mb-10">
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-widest text-primary/60 mb-1">
            <Trans>Overview</Trans>
          </p>
          <h2 className="text-4xl font-extrabold font-headline tracking-tighter text-primary">
            <Trans>Financial Dashboard</Trans>
          </h2>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setYearMonth((prev) => navigateMonth(prev, -1))}
            className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-colors"
          >
            <Icon name="chevron_left" className="text-xl text-primary" />
          </button>
          <span className="font-headline font-bold text-primary min-w-[160px] text-center">
            {formatYearMonth(yearMonth)}
          </span>
          <button
            type="button"
            onClick={() => setYearMonth((prev) => navigateMonth(prev, 1))}
            className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-colors"
          >
            <Icon name="chevron_right" className="text-xl text-primary" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card
          variant="hero"
          padding="xl"
          className="col-span-12 lg:col-span-8 flex flex-col justify-between"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-tertiary-container/30 text-tertiary text-[10px] font-bold uppercase tracking-widest rounded-full">
                <Trans>Monthly Overview</Trans>
              </span>
            </div>
            <h3 className="text-sm font-bold text-primary/50 uppercase tracking-widest mb-2">
              <Trans>Total Spending</Trans>
            </h3>
            <p className="text-7xl font-extrabold font-headline tracking-tighter text-primary">
              {formatCents(data?.totalSpending ?? 0)}
            </p>
          </div>
        </Card>

        <Card variant="default" padding="lg" className="col-span-12 lg:col-span-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline text-lg font-bold text-primary">
              <Trans>Recent Transactions</Trans>
            </h3>
          </div>
          <div className="space-y-5">
            {data?.recentTransactions.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-4">
                <Trans>No recent transactions.</Trans>
              </p>
            )}
            {data?.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-start space-x-3">
                <IconBox
                  icon={tx.amount < 0 ? 'remove' : 'add'}
                  size="sm"
                  shape="circle"
                  tone="surface"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="font-bold text-sm text-primary">
                      {tx.description ?? <Trans>Transaction</Trans>}
                    </p>
                    <p
                      className={`font-bold text-sm shrink-0 ml-2 ${tx.amount > 0 ? 'text-tertiary' : 'text-primary'}`}
                    >
                      {formatCents(tx.amount)}
                    </p>
                  </div>
                  <span className="text-[10px] text-outline">{tx.transactionDate}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="default" padding="lg" className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-xl font-bold text-primary">
              <Trans>Budget Summary</Trans>
            </h2>
          </div>
          <div className="space-y-6">
            {data?.budgetSummary.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-4">
                <Trans>No budget data for this month.</Trans>
              </p>
            )}
            {data?.budgetSummary.map((item) => {
              const utilization =
                item.planned > 0
                  ? Math.min(100, Math.round((item.actual / item.planned) * 100))
                  : 0;
              return (
                <div key={item.categoryName} className="flex items-center space-x-4">
                  <IconBox icon="category" size="md" tone="surface" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-primary">{item.categoryName}</p>
                      <div className="text-right">
                        <span className="font-bold text-sm text-primary">
                          {formatCents(item.actual)}
                        </span>
                        <span className="text-xs text-outline ml-2">
                          <Trans>of {formatCents(item.planned)}</Trans>
                        </span>
                      </div>
                    </div>
                    <ProgressBar value={utilization} size="md" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card variant="dark" padding="lg" className="col-span-12 lg:col-span-4">
          <h3 className="text-lg font-bold font-headline mb-6">
            <Trans>Monthly Insights</Trans>
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            <Trans>
              Track your spending patterns and budget utilization across categories for{' '}
              {formatYearMonth(yearMonth)}.
            </Trans>
          </p>
          {data && data.budgetSummary.length > 0 && (
            <div className="space-y-3">
              {data.budgetSummary.slice(0, 3).map((item) => {
                const overBudget = item.actual > item.planned;
                return (
                  <div
                    key={item.categoryName}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-white/80">{item.categoryName}</span>
                    <span
                      className={overBudget ? 'text-error font-bold' : 'text-secondary font-bold'}
                    >
                      {overBudget ? <Trans>Over budget</Trans> : <Trans>On track</Trans>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
