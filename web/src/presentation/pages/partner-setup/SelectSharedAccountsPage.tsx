import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import type { BankAccount } from '@/domain/models/partnership/Partnership';
import type { ILoadAccounts } from '@/domain/usecases/partnership/ILoadAccounts';
import type { ILoadSharedAccounts } from '@/domain/usecases/partnership/ILoadSharedAccounts';
import type { ISetSharedAccounts } from '@/domain/usecases/partnership/ISetSharedAccounts';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { InfoBanner } from '@/presentation/components/InfoBanner';
import { ToggleSwitch } from '@/presentation/components/ToggleSwitch';

type Props = {
  loadAccountsUseCase: ILoadAccounts;
  loadSharedAccountsUseCase: ILoadSharedAccounts;
  setSharedAccountsUseCase: ISetSharedAccounts;
};

const accountTypeIcons: Record<string, string> = {
  CHECKING: 'account_balance',
  SAVINGS: 'savings',
  CREDIT: 'credit_card',
  INVESTMENT: 'trending_up',
};

export function SelectSharedAccountsPage({
  loadAccountsUseCase,
  loadSharedAccountsUseCase,
  setSharedAccountsUseCase,
}: Props) {
  const { t } = useLingui();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [allAccounts, sharedAccounts] = await Promise.all([
        loadAccountsUseCase.execute(),
        loadSharedAccountsUseCase.execute(),
      ]);
      setAccounts(allAccounts);
      const sharedIds = new Set(sharedAccounts.map((a) => a.id));
      setSelected(Object.fromEntries(allAccounts.map((a) => [a.id, sharedIds.has(a.id)])));
    } catch {
      setServerError(t`Failed to load accounts`);
    } finally {
      setLoading(false);
    }
  }, [loadAccountsUseCase, loadSharedAccountsUseCase, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setServerError('');
    try {
      const bankAccountIds = Object.entries(selected)
        .filter(([, isSelected]) => isSelected)
        .map(([id]) => id);
      await setSharedAccountsUseCase.execute({ bankAccountIds });
    } catch {
      setServerError(t`Failed to save shared accounts`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <Icon name="hourglass_empty" className="text-4xl text-outline animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <div className="w-full max-w-lg text-center">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-6">
          <Trans>Partner Setup</Trans>
        </p>

        <h1 className="font-headline text-3xl font-bold text-primary tracking-tight mb-3">
          <Trans>Which stories shall we share?</Trans>
        </h1>
        <p className="text-on-surface-variant leading-relaxed mb-10 max-w-sm mx-auto">
          <Trans>
            Select the accounts you want to sync with your partner&apos;s ledger. Visibility can be
            adjusted per transaction later.
          </Trans>
        </p>

        {serverError && (
          <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
            {serverError}
          </div>
        )}

        <div className="space-y-3 text-left">
          {accounts.map((account) => (
            <Card key={account.id} variant="default" padding="md">
              <div className="flex items-center space-x-4">
                <IconBox
                  icon={accountTypeIcons[account.accountType] ?? 'account_balance'}
                  size="md"
                  shape="circle"
                  tone="surface"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-primary">{account.accountName}</p>
                  <p className="text-xs text-on-surface-variant">
                    {account.accountType} &bull; {account.currencyCode}
                  </p>
                </div>
                <ToggleSwitch
                  checked={selected[account.id] ?? false}
                  onChange={() => toggle(account.id)}
                />
              </div>
            </Card>
          ))}
          {accounts.length === 0 && (
            <p className="text-sm text-on-surface-variant text-center py-8">
              <Trans>No bank accounts found. Add accounts first to share them.</Trans>
            </p>
          )}
        </div>

        <InfoBanner
          icon="security"
          title={<Trans>Collaborative Security</Trans>}
          description={
            <Trans>
              Financial Harmony uses military-grade encryption for all shared data. Your partner can
              view history but cannot perform transactions or modify core settings.
            </Trans>
          }
          className="mt-6 text-left"
        />

        <div className="flex items-center justify-between mt-10">
          <Link
            to="/partner-setup/invite"
            className="inline-flex items-center space-x-1 text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            <Icon name="chevron_left" className="text-base" />
            <span>
              <Trans>Back</Trans>
            </span>
          </Link>
          <ProgressDots current={2} total={3} />
          <div className="flex space-x-3">
            <Button type="button" variant="ghost" size="md" onClick={handleSave} disabled={saving}>
              {saving ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
            </Button>
            <Link to="/partner-setup/contribution-rules">
              <Button type="button" variant="secondary" size="md" className="space-x-2">
                <span>
                  <Trans>Next</Trans>
                </span>
                <Icon name="arrow_forward" className="text-base" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  const dots = Array.from({ length: total }, (_, i) => `step-${i + 1}`);

  return (
    <div className="flex items-center space-x-1.5">
      {dots.map((id, i) => (
        <span
          key={id}
          className={`rounded-full transition-all ${
            i + 1 === current ? 'w-6 h-2 bg-secondary' : 'w-2 h-2 bg-outline-variant'
          }`}
        />
      ))}
    </div>
  );
}
