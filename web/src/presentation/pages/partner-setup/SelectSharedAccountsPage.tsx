import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Badge } from '@/presentation/components/Badge';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { InfoBanner } from '@/presentation/components/InfoBanner';
import { ToggleSwitch } from '@/presentation/components/ToggleSwitch';

const accounts = [
  {
    id: 'hsbc',
    icon: 'account_balance',
    name: 'HSBC Premier',
    detail: 'Personal Current • ••••4321',
    defaultOn: false,
  },
  {
    id: 'chase',
    icon: 'savings',
    name: 'Chase Savings',
    detail: 'Reserve Account • ••••4421',
    defaultOn: true,
  },
  {
    id: 'revolut',
    icon: 'credit_card',
    name: 'Revolut Business',
    detail: 'Spending Wallet • ••••2209',
    defaultOn: false,
  },
];

export function SelectSharedAccountsPage() {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(accounts.map((a) => [a.id, a.defaultOn])),
  );

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <div className="w-full max-w-lg text-center">
        <Badge variant="success" size="md" className="mb-6">
          <Trans>Partner Setup</Trans>
        </Badge>

        <h1 className="font-headline text-3xl font-bold text-on-surface tracking-tight mb-3">
          <Trans>Which stories shall we share?</Trans>
        </h1>
        <p className="text-on-surface-variant leading-relaxed mb-10 max-w-sm mx-auto">
          <Trans>
            Select the accounts you want to sync with your partner&apos;s ledger. You can adjust
            visibility settings for individual transactions later.
          </Trans>
        </p>

        <div className="space-y-3 text-left">
          {accounts.map((account) => (
            <Card key={account.id} variant="default" padding="md">
              <div className="flex items-center space-x-4">
                <IconBox icon={account.icon} size="md" shape="circle" tone="surface" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-on-surface">{account.name}</p>
                  <p className="text-xs text-on-surface-variant">{account.detail}</p>
                </div>
                <ToggleSwitch
                  checked={selected[account.id] ?? false}
                  onChange={() => toggle(account.id)}
                />
              </div>
            </Card>
          ))}
        </div>

        <InfoBanner
          icon="security"
          title={<Trans>Collaborative Security</Trans>}
          description={
            <Trans>
              Financial Harmony encrypts all shared ledger data. Your partner will see balances and
              transaction history, but cannot initiate transfers or change account settings.
            </Trans>
          }
          className="mt-6 text-left"
        />

        <div className="flex items-center justify-between mt-10">
          <Link
            to="/partner-setup/invite"
            className="inline-flex items-center space-x-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon name="chevron_left" className="text-base" />
            <span>
              <Trans>Back</Trans>
            </span>
          </Link>
          <ProgressDots current={2} total={3} />
          <Link to="/partner-setup/contribution-rules">
            <Button type="button" variant="primary" size="md" className="space-x-2">
              <span>
                <Trans>Next</Trans>
              </span>
              <Icon name="arrow_forward" className="text-base" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center space-x-1.5">
      {/* biome-ignore lint/suspicious/noArrayIndexKey: static list of decorative dots */}
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all ${
            i + 1 === current ? 'w-6 h-2 bg-secondary' : 'w-2 h-2 bg-outline-variant'
          }`}
        />
      ))}
    </div>
  );
}
