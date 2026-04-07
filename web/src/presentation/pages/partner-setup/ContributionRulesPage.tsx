import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  type ContributionRule,
  ContributionType,
  type SetContributionRuleInput,
  setContributionRuleInputSchema,
} from '@/domain/models/partnership/Partnership';
import type { ILoadContributionRules } from '@/domain/usecases/partnership/ILoadContributionRules';
import type { ISetContributionRules } from '@/domain/usecases/partnership/ISetContributionRules';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { ProgressBar } from '@/presentation/components/ProgressBar';
import { SelectableCard } from '@/presentation/components/SelectableCard';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  loadContributionRulesUseCase: ILoadContributionRules;
  setContributionRulesUseCase: ISetContributionRules;
};

type RuleOption = {
  id: ContributionType;
  icon: string;
};

const ruleOptions: RuleOption[] = [
  { id: ContributionType.EQUAL, icon: 'balance' },
  { id: ContributionType.SALARY_PROPORTIONAL, icon: 'bar_chart' },
  { id: ContributionType.CUSTOM_PERCENTAGE, icon: 'tune' },
];

export function ContributionRulesPage({
  loadContributionRulesUseCase,
  setContributionRulesUseCase,
}: Props) {
  const { t } = useLingui();
  const [currentRule, setCurrentRule] = useState<ContributionRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SetContributionRuleInput>({
    resolver: zodResolver(setContributionRuleInputSchema),
    defaultValues: {
      type: ContributionType.EQUAL,
    },
  });

  const selectedType = watch('type');
  const customerAPercentage = watch('customerAPercentage');

  const loadData = useCallback(async () => {
    try {
      const rule = await loadContributionRulesUseCase.execute();
      setCurrentRule(rule);
      setValue('type', rule.type);
      if (rule.customerAPercentage !== null) {
        setValue('customerAPercentage', rule.customerAPercentage);
      }
      if (rule.customerBPercentage !== null) {
        setValue('customerBPercentage', rule.customerBPercentage);
      }
    } catch {
      setServerError(t`Failed to load contribution rules`);
    } finally {
      setLoading(false);
    }
  }, [loadContributionRulesUseCase, setValue, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSubmit = async (data: SetContributionRuleInput) => {
    setServerError('');
    try {
      const result = await setContributionRulesUseCase.execute(data);
      setCurrentRule(result);
    } catch {
      setServerError(t`Failed to save contribution rules`);
    }
  };

  const previewPercentageA =
    selectedType === ContributionType.EQUAL
      ? 50
      : selectedType === ContributionType.CUSTOM_PERCENTAGE
        ? (customerAPercentage ?? 50)
        : (currentRule?.customerAPercentage ?? 50);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <Icon name="hourglass_empty" className="text-4xl text-outline animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-full p-8">
      <div className="w-full max-w-2xl text-center">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-6">
          <Trans>Step 3 of 3</Trans>
        </p>

        <h1 className="font-headline text-4xl font-bold text-primary tracking-tight mb-3">
          <Trans>Contribution Rules</Trans>
        </h1>
        <p className="text-on-surface-variant leading-relaxed mb-10 max-w-md mx-auto">
          <Trans>
            Decide how you and your partner will split shared expenses and savings goals.
          </Trans>
        </p>

        {serverError && (
          <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-3 gap-4 mb-10">
            {ruleOptions.map((option) => (
              <SelectableCard
                key={option.id}
                selected={selectedType === option.id}
                onSelect={() => setValue('type', option.id)}
              >
                <div className="text-center">
                  <IconBox
                    icon={option.icon}
                    size="md"
                    tone={selectedType === option.id ? 'secondary' : 'surface'}
                    className="mx-auto mb-4"
                  />
                  <h3 className="font-bold text-primary mb-2">
                    <RuleTitle type={option.id} />
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                    <RuleDescription type={option.id} />
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center justify-center space-x-1">
                    {selectedType === option.id && <Icon name="check_circle" className="text-sm" />}
                    <span>
                      <RuleTag type={option.id} />
                    </span>
                  </p>
                </div>
              </SelectableCard>
            ))}
          </div>

          {selectedType === ContributionType.CUSTOM_PERCENTAGE && (
            <Card variant="default" padding="lg" className="text-left mb-8">
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">
                <Trans>Custom Split</Trans>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  id="customerAPercentage"
                  type="number"
                  label={t`Partner A %`}
                  placeholder="50"
                  error={errors.customerAPercentage?.message}
                  {...register('customerAPercentage', { valueAsNumber: true })}
                />
                <TextInput
                  id="customerBPercentage"
                  type="number"
                  label={t`Partner B %`}
                  placeholder="50"
                  error={errors.customerBPercentage?.message}
                  {...register('customerBPercentage', { valueAsNumber: true })}
                />
              </div>
            </Card>
          )}

          <Card variant="default" padding="lg" className="text-left mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                  <Trans>Preview</Trans>
                </p>
                <p className="text-xs text-on-surface-variant">
                  <Trans>Contribution split visualization</Trans>
                </p>
              </div>
            </div>
            <ProgressBar value={previewPercentageA} size="xl" color="gradient" className="mb-4" />
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-on-surface-variant">
                  <Trans>Partner A</Trans>
                </span>
                <span className="font-bold text-primary">{previewPercentageA}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-primary">{100 - previewPercentageA}%</span>
                <span className="text-on-surface-variant">
                  <Trans>Partner B</Trans>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <Link
              to="/partner-setup/select-accounts"
              className="inline-flex items-center space-x-1 text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              <Icon name="chevron_left" className="text-base" />
              <span>
                <Trans>Back</Trans>
              </span>
            </Link>
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="space-x-2"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? <Trans>Saving...</Trans> : <Trans>Finish Setup</Trans>}</span>
              <Icon name="check_circle" className="text-lg" />
            </Button>
          </div>
        </form>

        <p className="mt-8 text-xs text-on-surface-variant">
          <Trans>
            You can adjust these rules anytime in{' '}
            <span className="font-bold text-primary">Shared Settings</span>.
          </Trans>
        </p>
      </div>
    </div>
  );
}

function RuleTitle({ type }: { type: ContributionType }) {
  switch (type) {
    case ContributionType.EQUAL:
      return <Trans>50/50 Split</Trans>;
    case ContributionType.SALARY_PROPORTIONAL:
      return <Trans>Salary-Based</Trans>;
    case ContributionType.CUSTOM_PERCENTAGE:
      return <Trans>Custom %</Trans>;
  }
}

function RuleDescription({ type }: { type: ContributionType }) {
  switch (type) {
    case ContributionType.EQUAL:
      return <Trans>Purely equal contribution regardless of income levels.</Trans>;
    case ContributionType.SALARY_PROPORTIONAL:
      return <Trans>Contribution ratio automatically scales with your earnings.</Trans>;
    case ContributionType.CUSTOM_PERCENTAGE:
      return <Trans>Define your own unique percentage split per category.</Trans>;
  }
}

function RuleTag({ type }: { type: ContributionType }) {
  switch (type) {
    case ContributionType.EQUAL:
      return <Trans>Perfect Balance</Trans>;
    case ContributionType.SALARY_PROPORTIONAL:
      return <Trans>Equity First</Trans>;
    case ContributionType.CUSTOM_PERCENTAGE:
      return <Trans>Maximum Control</Trans>;
  }
}
