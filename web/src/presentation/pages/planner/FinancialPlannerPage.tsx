import { zodResolver } from '@hookform/resolvers/zod';
import { Trans } from '@lingui/react/macro';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { BudgetCategory } from '@/domain/models/budget/BudgetCategory';
import {
  type CreateBudgetCategoryInput,
  createBudgetCategoryInputSchema,
} from '@/domain/models/budget/BudgetCategory';
import {
  type AddBudgetItemInput,
  addBudgetItemInputSchema,
  type BudgetItem,
  type BudgetPlanWithItems,
  type BudgetSummary,
  type BudgetSummaryItem,
  type CreateBudgetPlanInput,
  createBudgetPlanInputSchema,
} from '@/domain/models/budget/BudgetPlan';
import type { IAddBudgetItem } from '@/domain/usecases/budget/IAddBudgetItem';
import type { ICreateBudgetCategory } from '@/domain/usecases/budget/ICreateBudgetCategory';
import type { ICreateBudgetPlan } from '@/domain/usecases/budget/ICreateBudgetPlan';
import type { ICreateJointBudgetPlan } from '@/domain/usecases/budget/ICreateJointBudgetPlan';
import type { IDeleteBudgetCategory } from '@/domain/usecases/budget/IDeleteBudgetCategory';
import type { IDeleteBudgetItem } from '@/domain/usecases/budget/IDeleteBudgetItem';
import type { IDeleteBudgetPlan } from '@/domain/usecases/budget/IDeleteBudgetPlan';
import type { IDeleteJointBudgetPlan } from '@/domain/usecases/budget/IDeleteJointBudgetPlan';
import type { ILoadBudgetCategories } from '@/domain/usecases/budget/ILoadBudgetCategories';
import type { ILoadBudgetPlan } from '@/domain/usecases/budget/ILoadBudgetPlan';
import type { ILoadBudgetSummary } from '@/domain/usecases/budget/ILoadBudgetSummary';
import type { ILoadJointBudgetPlan } from '@/domain/usecases/budget/ILoadJointBudgetPlan';
import type { IUpdateBudgetItem } from '@/domain/usecases/budget/IUpdateBudgetItem';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { ProgressBar } from '@/presentation/components/ProgressBar';
import { Select } from '@/presentation/components/Select';
import { TextInput } from '@/presentation/components/TextInput';

export type FinancialPlannerPageProps = {
  loadCategories: ILoadBudgetCategories;
  createCategory: ICreateBudgetCategory;
  deleteCategory: IDeleteBudgetCategory;
  loadPlan: ILoadBudgetPlan;
  createPlan: ICreateBudgetPlan;
  deletePlan: IDeleteBudgetPlan;
  loadJointPlan: ILoadJointBudgetPlan;
  createJointPlan: ICreateJointBudgetPlan;
  deleteJointPlan: IDeleteJointBudgetPlan;
  addItem: IAddBudgetItem;
  updateItem: IUpdateBudgetItem;
  deleteItem: IDeleteBudgetItem;
  loadSummary: ILoadBudgetSummary;
};

function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatYearMonth(ym: string): string {
  const parts = ym.split('-');
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function shiftMonth(ym: string, delta: number): string {
  const parts = ym.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const date = new Date(year, month - 1 + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

type ActiveTab = 'personal' | 'joint';

function MonthPicker({
  yearMonth,
  onChange,
}: {
  yearMonth: string;
  onChange: (ym: string) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(yearMonth, -1))}
        className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-colors"
      >
        <Icon name="chevron_left" className="text-xl text-on-surface-variant" />
      </button>
      <h2 className="font-headline text-2xl font-bold text-primary min-w-48 text-center">
        {formatYearMonth(yearMonth)}
      </h2>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(yearMonth, 1))}
        className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center cursor-pointer hover:bg-surface-variant transition-colors"
      >
        <Icon name="chevron_right" className="text-xl text-on-surface-variant" />
      </button>
    </div>
  );
}

function TabSwitcher({
  active,
  onChange,
}: {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}) {
  return (
    <div className="bg-surface-container-high p-1 rounded-2xl flex gap-1">
      <button
        type="button"
        onClick={() => onChange('personal')}
        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
          active === 'personal'
            ? 'bg-primary text-on-primary shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-variant'
        }`}
      >
        <Trans>Personal</Trans>
      </button>
      <button
        type="button"
        onClick={() => onChange('joint')}
        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
          active === 'joint'
            ? 'bg-primary text-on-primary shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-variant'
        }`}
      >
        <Trans>Joint</Trans>
      </button>
    </div>
  );
}

function CreatePlanForm({
  onSubmit,
  loading,
  yearMonth,
}: {
  onSubmit: (input: CreateBudgetPlanInput) => void;
  loading: boolean;
  yearMonth: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBudgetPlanInput>({
    resolver: zodResolver(createBudgetPlanInputSchema),
    defaultValues: { yearMonth },
  });

  return (
    <Card variant="outlined" padding="lg" className="text-center">
      <Icon name="event_note" className="text-5xl text-outline mb-4" />
      <h3 className="font-headline text-xl font-bold text-primary mb-2">
        <Trans>No budget plan for this month</Trans>
      </h3>
      <p className="text-sm text-on-surface-variant mb-6">
        <Trans>Create a plan to start tracking your income and expenses.</Trans>
      </p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-end gap-4 justify-center max-w-md mx-auto"
      >
        <input type="hidden" {...register('yearMonth')} />
        <div className="flex-1">
          <Select
            label="Currency"
            id="currencyCode"
            icon={<Icon name="currency_exchange" className="text-lg" />}
            error={errors.currencyCode?.message}
            {...register('currencyCode')}
          >
            <option value="">--</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="BRL">BRL</option>
            <option value="GBP">GBP</option>
          </Select>
        </div>
        <Button type="submit" variant="primary" size="md" disabled={loading}>
          {loading ? <Trans>Creating...</Trans> : <Trans>Create Plan</Trans>}
        </Button>
      </form>
    </Card>
  );
}

function AddItemForm({
  planId,
  categories,
  onSubmit,
  loading,
}: {
  planId: string;
  categories: BudgetCategory[];
  onSubmit: (planId: string, input: AddBudgetItemInput) => void;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AddBudgetItemInput>({
    resolver: zodResolver(addBudgetItemInputSchema),
    defaultValues: {
      direction: 'EXPENSE',
      type: 'FIXED',
      recurrence: 'PERMANENT',
    },
  });

  const recurrence = watch('recurrence');

  const onFormSubmit = (data: AddBudgetItemInput) => {
    onSubmit(planId, { ...data, plannedAmount: Math.round(data.plannedAmount * 100) });
    reset();
  };

  return (
    <Card variant="outlined" padding="md" className="mb-6">
      <h4 className="font-headline text-sm font-bold text-primary mb-4">
        <Trans>Add Item</Trans>
      </h4>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <TextInput
            label="Name"
            id="item-name"
            placeholder="e.g. Rent"
            error={errors.name?.message}
            {...register('name')}
          />
          <TextInput
            label="Amount"
            id="item-amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            icon={<Icon name="attach_money" className="text-lg" />}
            error={errors.plannedAmount?.message}
            {...register('plannedAmount', { valueAsNumber: true })}
          />
          <Select
            label="Category"
            id="item-category"
            error={errors.categoryId?.message}
            {...register('categoryId')}
          >
            <option value="">--</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Direction"
            id="item-direction"
            error={errors.direction?.message}
            {...register('direction')}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <Select label="Type" id="item-type" error={errors.type?.message} {...register('type')}>
            <option value="FIXED">Fixed</option>
            <option value="ESTIMATED">Estimated</option>
          </Select>
          <Select
            label="Recurrence"
            id="item-recurrence"
            error={errors.recurrence?.message}
            {...register('recurrence')}
          >
            <option value="PERMANENT">Permanent</option>
            <option value="ONE_TIME">One Time</option>
            <option value="INSTALLMENT">Installment</option>
          </Select>
          {recurrence === 'INSTALLMENT' && (
            <TextInput
              label="Total Installments"
              id="item-installments"
              type="number"
              min="1"
              error={errors.installmentTotal?.message}
              {...register('installmentTotal', { valueAsNumber: true })}
            />
          )}
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? <Trans>Adding...</Trans> : <Trans>Add</Trans>}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function BudgetItemRow({
  item,
  category,
  currency,
  onDelete,
}: {
  item: BudgetItem;
  category: BudgetCategory | undefined;
  currency: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center space-x-4 py-3 border-b border-surface-container-highest last:border-b-0">
      <IconBox
        icon={category?.icon ?? 'category'}
        size="sm"
        shape="circle"
        tone={item.direction === 'INCOME' ? 'secondary' : 'surface'}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="font-bold text-sm text-primary truncate">{item.name}</p>
          <p
            className={`font-bold text-sm ${item.direction === 'INCOME' ? 'text-secondary' : 'text-primary'}`}
          >
            {item.direction === 'INCOME' ? '+' : '-'}
            {formatCents(item.plannedAmount, currency)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant">{category?.name ?? '-'}</span>
          <span className="text-xs text-outline">{item.type}</span>
          <span className="text-xs text-outline">{item.recurrence}</span>
          {item.installmentNumber && item.installmentTotal && (
            <span className="text-xs text-outline">
              {item.installmentNumber}/{item.installmentTotal}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error/10 transition-colors cursor-pointer"
      >
        <Icon name="delete" className="text-lg text-error" />
      </button>
    </div>
  );
}

function BudgetItemsList({
  items,
  categories,
  currency,
  onDeleteItem,
}: {
  items: BudgetItem[];
  categories: BudgetCategory[];
  currency: string;
  onDeleteItem: (itemId: string) => void;
}) {
  const categoryMap = useMemo(() => {
    const map = new Map<string, BudgetCategory>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const incomeItems = items.filter((i) => i.direction === 'INCOME');
  const expenseItems = items.filter((i) => i.direction === 'EXPENSE');

  const totalIncome = incomeItems.reduce((sum, i) => sum + i.plannedAmount, 0);
  const totalExpenses = expenseItems.reduce((sum, i) => sum + i.plannedAmount, 0);

  return (
    <div className="space-y-6">
      {incomeItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-headline text-sm font-bold text-secondary flex items-center gap-2">
              <Icon name="trending_up" className="text-lg" />
              <Trans>Income</Trans>
            </h4>
            <span className="font-bold text-sm text-secondary">
              {formatCents(totalIncome, currency)}
            </span>
          </div>
          {incomeItems.map((item) => (
            <BudgetItemRow
              key={item.id}
              item={item}
              category={categoryMap.get(item.categoryId)}
              currency={currency}
              onDelete={() => onDeleteItem(item.id)}
            />
          ))}
        </div>
      )}
      {expenseItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-headline text-sm font-bold text-primary flex items-center gap-2">
              <Icon name="trending_down" className="text-lg" />
              <Trans>Expenses</Trans>
            </h4>
            <span className="font-bold text-sm text-primary">
              {formatCents(totalExpenses, currency)}
            </span>
          </div>
          {expenseItems.map((item) => (
            <BudgetItemRow
              key={item.id}
              item={item}
              category={categoryMap.get(item.categoryId)}
              currency={currency}
              onDelete={() => onDeleteItem(item.id)}
            />
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="pt-4 border-t border-surface-container-highest flex items-center justify-between">
          <span className="text-sm font-bold text-on-surface-variant">
            <Trans>Net</Trans>
          </span>
          <span
            className={`text-xl font-extrabold font-headline ${totalIncome - totalExpenses >= 0 ? 'text-secondary' : 'text-error'}`}
          >
            {formatCents(totalIncome - totalExpenses, currency)}
          </span>
        </div>
      )}
      {items.length === 0 && (
        <p className="text-center text-on-surface-variant text-sm py-8">
          <Trans>No items yet. Add your first income or expense above.</Trans>
        </p>
      )}
    </div>
  );
}

function SummarySection({
  summary,
  categories,
}: {
  summary: BudgetSummary | null;
  categories: BudgetCategory[];
}) {
  if (!summary) return null;

  const categoryMap = new Map<string, BudgetCategory>();
  for (const c of categories) categoryMap.set(c.id, c);

  const utilizationPercent =
    summary.personalIncome > 0
      ? Math.round(
          ((summary.personalExpenses + summary.yourJointShare) / summary.personalIncome) * 100,
        )
      : 0;

  return (
    <Card variant="default" padding="lg">
      <h3 className="font-headline text-lg font-bold text-primary mb-6 flex items-center gap-2">
        <Icon name="bar_chart" className="text-xl" />
        <Trans>Monthly Summary</Trans>
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">
            <Trans>Personal Income</Trans>
          </p>
          <p className="text-xl font-extrabold font-headline text-primary">
            {formatCents(summary.personalIncome)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">
            <Trans>Personal Expenses</Trans>
          </p>
          <p className="text-xl font-extrabold font-headline text-primary">
            {formatCents(summary.personalExpenses)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">
            <Trans>Joint Expenses</Trans>
          </p>
          <p className="text-xl font-extrabold font-headline text-primary">
            {formatCents(summary.jointExpenses)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1">
            <Trans>Your Joint Share</Trans>
          </p>
          <p className="text-xl font-extrabold font-headline text-primary">
            {formatCents(summary.yourJointShare)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">
            <Trans>Free Amount</Trans>
          </p>
          <p
            className={`text-xl font-extrabold font-headline ${summary.freeAmount >= 0 ? 'text-secondary' : 'text-error'}`}
          >
            {formatCents(summary.freeAmount)}
          </p>
        </div>
      </div>
      {summary.personalIncome > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">
              <Trans>Budget Utilization</Trans>
            </span>
            <span className="text-sm font-bold text-tertiary">
              {Math.min(utilizationPercent, 100)}%
            </span>
          </div>
          <ProgressBar
            value={Math.min(utilizationPercent, 100)}
            size="lg"
            color={utilizationPercent > 100 ? 'primary' : 'gradient'}
          />
        </div>
      )}
      <SummaryItemsTable
        title={<Trans>Personal Items</Trans>}
        items={summary.personalItems}
        categoryMap={categoryMap}
      />
      <SummaryItemsTable
        title={<Trans>Joint Items</Trans>}
        items={summary.jointItems}
        categoryMap={categoryMap}
      />
    </Card>
  );
}

function SummaryItemsTable({
  title,
  items,
  categoryMap,
}: {
  title: React.ReactNode;
  items: BudgetSummaryItem[];
  categoryMap: Map<string, BudgetCategory>;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item) => {
          const cat = categoryMap.get(item.categoryId);
          const percent =
            item.plannedAmount > 0 ? Math.round((item.actualAmount / item.plannedAmount) * 100) : 0;
          return (
            <div key={item.itemId} className="flex items-center gap-3">
              <IconBox
                icon={cat?.icon ?? 'category'}
                size="sm"
                shape="circle"
                tone={item.direction === 'INCOME' ? 'secondary' : 'surface'}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-primary truncate">{item.name}</span>
                  <span className="text-xs text-on-surface-variant">
                    {formatCents(item.actualAmount)} / {formatCents(item.plannedAmount)}
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(percent, 100)}
                  size="sm"
                  color={percent > 100 ? 'primary' : 'gradient'}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryManager({
  categories,
  onAdd,
  onDelete,
}: {
  categories: BudgetCategory[];
  onAdd: (input: CreateBudgetCategoryInput) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBudgetCategoryInput>({
    resolver: zodResolver(createBudgetCategoryInputSchema),
  });

  const onFormSubmit = (data: CreateBudgetCategoryInput) => {
    onAdd(data);
    reset();
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-bold text-secondary hover:underline cursor-pointer mb-4"
      >
        <Icon name="settings" className="text-base" />
        <Trans>Manage Categories</Trans>
      </button>
      {open && (
        <Card variant="outlined" padding="md" className="mb-6">
          <form onSubmit={handleSubmit(onFormSubmit)} className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <TextInput
                label="Category Name"
                id="cat-name"
                placeholder="e.g. Food"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>
            <div className="w-32">
              <TextInput
                label="Icon"
                id="cat-icon"
                placeholder="e.g. restaurant"
                {...register('icon')}
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              <Trans>Add</Trans>
            </Button>
          </form>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between py-2 border-b border-surface-container-highest last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <IconBox icon={cat.icon ?? 'category'} size="sm" shape="circle" tone="surface" />
                  <span className="text-sm font-bold text-primary">{cat.name}</span>
                  {cat.isSystem && (
                    <span className="text-[10px] text-outline uppercase tracking-widest">
                      <Trans>System</Trans>
                    </span>
                  )}
                </div>
                {!cat.isSystem && (
                  <button
                    type="button"
                    onClick={() => onDelete(cat.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-error/10 transition-colors cursor-pointer"
                  >
                    <Icon name="close" className="text-sm text-error" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export function FinancialPlannerPage(props: FinancialPlannerPageProps) {
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);
  const [activeTab, setActiveTab] = useState<ActiveTab>('personal');
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [personalPlan, setPersonalPlan] = useState<BudgetPlanWithItems | null>(null);
  const [jointPlan, setJointPlan] = useState<BudgetPlanWithItems | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);

  const activePlan = activeTab === 'personal' ? personalPlan : jointPlan;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, personal, joint, sum] = await Promise.all([
        props.loadCategories.execute(),
        props.loadPlan.execute(yearMonth),
        props.loadJointPlan.execute(yearMonth).catch(() => null),
        props.loadSummary.execute(yearMonth).catch(() => null),
      ]);
      setCategories(cats);
      setPersonalPlan(personal);
      setJointPlan(joint);
      setSummary(sum);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [yearMonth, props]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePlan = async (input: CreateBudgetPlanInput) => {
    setLoading(true);
    try {
      const planInput = { ...input, yearMonth };
      if (activeTab === 'personal') {
        const result = await props.createPlan.execute(planInput);
        setPersonalPlan(result);
      } else {
        const result = await props.createJointPlan.execute(planInput);
        setJointPlan(result);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!activePlan) return;
    setLoading(true);
    try {
      if (activeTab === 'personal') {
        await props.deletePlan.execute(activePlan.plan.id);
        setPersonalPlan(null);
      } else {
        await props.deleteJointPlan.execute(activePlan.plan.id);
        setJointPlan(null);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (planId: string, input: AddBudgetItemInput) => {
    setItemLoading(true);
    try {
      await props.addItem.execute(planId, input);
      await loadData();
    } catch {
    } finally {
      setItemLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!activePlan) return;
    setItemLoading(true);
    try {
      await props.deleteItem.execute(activePlan.plan.id, itemId);
      await loadData();
    } catch {
    } finally {
      setItemLoading(false);
    }
  };

  const handleAddCategory = async (input: CreateBudgetCategoryInput) => {
    try {
      const cat = await props.createCategory.execute(input);
      setCategories((prev) => [...prev, cat]);
    } catch {}
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await props.deleteCategory.execute(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-3xl font-bold text-primary tracking-tight">
          <Trans>Budget Planner</Trans>
        </h1>
        <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <TabSwitcher active={activeTab} onChange={setActiveTab} />
        {activePlan && (
          <button
            type="button"
            onClick={handleDeletePlan}
            className="flex items-center gap-1 text-sm font-bold text-error hover:underline cursor-pointer"
          >
            <Icon name="delete" className="text-base" />
            <Trans>Delete Plan</Trans>
          </button>
        )}
      </div>

      {loading && !activePlan && (
        <div className="text-center py-12">
          <Icon name="hourglass_empty" className="text-4xl text-outline animate-spin" />
        </div>
      )}

      {!loading && !activePlan && (
        <CreatePlanForm onSubmit={handleCreatePlan} loading={loading} yearMonth={yearMonth} />
      )}

      {activePlan && (
        <div className="space-y-6">
          <AddItemForm
            planId={activePlan.plan.id}
            categories={categories}
            onSubmit={handleAddItem}
            loading={itemLoading}
          />
          <Card variant="default" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-lg font-bold text-primary">
                {activeTab === 'personal' ? (
                  <Trans>Personal Budget</Trans>
                ) : (
                  <Trans>Joint Budget</Trans>
                )}
              </h3>
              <span className="text-xs text-outline uppercase tracking-widest">
                {activePlan.plan.currencyCode}
              </span>
            </div>
            <BudgetItemsList
              items={activePlan.items}
              categories={categories}
              currency={activePlan.plan.currencyCode}
              onDeleteItem={handleDeleteItem}
            />
          </Card>
        </div>
      )}

      <div className="mt-8">
        <SummarySection summary={summary} categories={categories} />
      </div>

      <div className="mt-8">
        <CategoryManager
          categories={categories}
          onAdd={handleAddCategory}
          onDelete={handleDeleteCategory}
        />
      </div>
    </div>
  );
}
