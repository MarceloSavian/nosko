import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Badge } from '@/presentation/components/Badge';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { ProgressBar } from '@/presentation/components/ProgressBar';
import { SelectableCard } from '@/presentation/components/SelectableCard';

type RuleOption = 'equal' | 'salary' | 'custom';

const ruleOptions: {
  id: RuleOption;
  icon: string;
  titleKey: string;
  descKey: string;
  tagKey: string;
}[] = [
  {
    id: 'equal',
    icon: 'balance',
    titleKey: '50/50 Split',
    descKey: 'Purely equal contribution regardless of income levels.',
    tagKey: 'Perfect Balance',
  },
  {
    id: 'salary',
    icon: 'bar_chart',
    titleKey: 'Salary-Based',
    descKey: 'Contribution ratio automatically scales with your earnings.',
    tagKey: 'Equity First',
  },
  {
    id: 'custom',
    icon: 'tune',
    titleKey: 'Custom %',
    descKey: 'Define your own unique percentage split per category.',
    tagKey: 'Maximum Control',
  },
];

function RuleTitle({ titleKey }: { titleKey: string }) {
  switch (titleKey) {
    case '50/50 Split':
      return <Trans>50/50 Split</Trans>;
    case 'Salary-Based':
      return <Trans>Salary-Based</Trans>;
    case 'Custom %':
      return <Trans>Custom %</Trans>;
    default:
      return titleKey;
  }
}

function RuleDescription({ descKey }: { descKey: string }) {
  switch (descKey) {
    case 'Purely equal contribution regardless of income levels.':
      return <Trans>Purely equal contribution regardless of income levels.</Trans>;
    case 'Contribution ratio automatically scales with your earnings.':
      return <Trans>Contribution ratio automatically scales with your earnings.</Trans>;
    case 'Define your own unique percentage split per category.':
      return <Trans>Define your own unique percentage split per category.</Trans>;
    default:
      return descKey;
  }
}

function RuleTag({ tagKey }: { tagKey: string }) {
  switch (tagKey) {
    case 'Perfect Balance':
      return <Trans>Perfect Balance</Trans>;
    case 'Equity First':
      return <Trans>Equity First</Trans>;
    case 'Maximum Control':
      return <Trans>Maximum Control</Trans>;
    default:
      return tagKey;
  }
}

export function ContributionRulesPage() {
  const [selected, setSelected] = useState<RuleOption>('equal');

  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <div className="w-full max-w-2xl text-center">
        <Badge variant="neutral" size="md" className="mb-6">
          <Trans>Step 3 of 3</Trans>
        </Badge>

        <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight mb-3">
          <Trans>Contribution Rules</Trans>
        </h1>
        <p className="text-on-surface-variant leading-relaxed mb-10 max-w-md mx-auto">
          <Trans>
            Decide how you and your partner will split shared expenses and savings goals.
          </Trans>
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10">
          {ruleOptions.map((option) => (
            <SelectableCard
              key={option.id}
              selected={selected === option.id}
              onSelect={() => setSelected(option.id)}
            >
              <div className="text-center">
                <IconBox
                  icon={option.icon}
                  size="md"
                  tone={selected === option.id ? 'secondary' : 'surface'}
                  className="mx-auto mb-4"
                />
                <h3 className="font-bold text-on-surface mb-2">
                  <RuleTitle titleKey={option.titleKey} />
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                  <RuleDescription descKey={option.descKey} />
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center justify-center space-x-1">
                  {selected === option.id && <Icon name="check_circle" className="text-sm" />}
                  <span>
                    <RuleTag tagKey={option.tagKey} />
                  </span>
                </p>
              </div>
            </SelectableCard>
          ))}
        </div>

        <Card variant="default" padding="lg" className="text-left mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                <Trans>Previewing: 50/50 Split</Trans>
              </p>
              <p className="text-xs text-on-surface-variant">
                <Trans>Estimated monthly commitment based on your last 30 days.</Trans>
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-headline font-bold text-on-surface">$3,450.00</p>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                <Trans>Total Household Spend</Trans>
              </p>
            </div>
          </div>
          <ProgressBar value={50} size="xl" color="gradient" className="mb-4" />
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-on-surface-variant">
                <Trans>Alex&apos;s Share</Trans>
              </span>
              <span className="font-bold text-on-surface">$1,725.00</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-on-surface">$1,725.00</span>
              <span className="text-on-surface-variant">
                <Trans>Lori&apos;s Share</Trans>
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <Link
            to="/partner-setup/select-accounts"
            className="inline-flex items-center space-x-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <Icon name="chevron_left" className="text-base" />
            <span>
              <Trans>Back to Earnings</Trans>
            </span>
          </Link>
          <Button type="button" variant="primary" size="lg" className="space-x-2">
            <span>
              <Trans>Finish Setup</Trans>
            </span>
            <Icon name="check_circle" className="text-lg" />
          </Button>
        </div>

        <p className="mt-8 text-xs text-on-surface-variant">
          <Trans>
            You can adjust these rules anytime in{' '}
            <span className="font-bold text-on-surface">Shared Settings</span>.
          </Trans>
        </p>
      </div>
    </div>
  );
}
