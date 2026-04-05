import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  AccountType,
  type BankAccount,
  type CreateBankAccountInput,
  type CurrencyTotal,
  createBankAccountInputSchema,
  type UpdateBankAccountInput,
} from '@/domain/models/account/Account';
import type { Institution } from '@/domain/models/institution/Institution';
import type { ICreateAccount } from '@/domain/usecases/account/ICreateAccount';
import type { IDeleteAccount } from '@/domain/usecases/account/IDeleteAccount';
import type { ILoadAccountOverview } from '@/domain/usecases/account/ILoadAccountOverview';
import type { ILoadAccounts } from '@/domain/usecases/account/ILoadAccounts';
import type { IUpdateAccount } from '@/domain/usecases/account/IUpdateAccount';
import type { ILoadInstitutions } from '@/domain/usecases/institution/ILoadInstitutions';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { IconBox } from '@/presentation/components/IconBox';
import { PageHeader } from '@/presentation/components/PageHeader';
import { Select } from '@/presentation/components/Select';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  loadAccounts: ILoadAccounts;
  createAccount: ICreateAccount;
  updateAccount: IUpdateAccount;
  deleteAccount: IDeleteAccount;
  loadAccountOverview: ILoadAccountOverview;
  loadInstitutions: ILoadInstitutions;
};

const accountTypeIcons: Record<string, string> = {
  CHECKING: 'account_balance',
  SAVINGS: 'savings',
  CREDIT: 'credit_card',
  INVESTMENT: 'trending_up',
};

function formatCents(cents: number, currencyCode: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
  }).format(cents / 100);
}

function OverviewTotals({ totals }: { totals: CurrencyTotal[] }) {
  if (totals.length === 0) {
    return (
      <Card variant="hero" padding="xl" className="mb-8">
        <p className="text-on-surface-variant text-center py-8">
          <Trans>No accounts yet. Add your first account to get started.</Trans>
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {totals.map((total) => (
        <Card key={total.currencyCode} variant="hero" padding="lg">
          <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-2">
            <Trans>Total Balance</Trans> ({total.currencyCode})
          </p>
          <p className="text-3xl font-extrabold font-headline tracking-tight text-primary">
            {formatCents(total.total, total.currencyCode)}
          </p>
        </Card>
      ))}
    </div>
  );
}

function AccountCard({
  account,
  institutionName,
  onEdit,
  onDelete,
}: {
  account: BankAccount;
  institutionName: string;
  onEdit: (account: BankAccount) => void;
  onDelete: (account: BankAccount) => void;
}) {
  return (
    <Card variant="default" padding="md" className="hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <IconBox
          icon={accountTypeIcons[account.accountType] ?? 'account_balance'}
          size="md"
          shape="rounded"
          tone="surface"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(account)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <Icon name="edit" className="text-base text-on-surface-variant" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(account)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-error/10 transition-colors cursor-pointer"
          >
            <Icon name="delete" className="text-base text-error" />
          </button>
        </div>
      </div>
      <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">
        {institutionName}
      </p>
      <p className="text-lg font-bold text-primary mb-1">{account.accountName}</p>
      <p className="text-xs text-on-surface-variant mb-4">{account.accountType}</p>
      <p className="text-2xl font-extrabold font-headline tracking-tight text-primary">
        {formatCents(account.balance, account.currencyCode)}
      </p>
    </Card>
  );
}

function CreateAccountModal({
  institutions,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  institutions: Institution[];
  onSubmit: (data: CreateBankAccountInput) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBankAccountInput>({
    resolver: zodResolver(createBankAccountInputSchema),
    defaultValues: {
      accountType: AccountType.CHECKING,
      balance: 0,
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card variant="default" padding="lg" className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-2xl font-bold text-primary">
            <Trans>Add Account</Trans>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-xl text-on-surface-variant" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            id="institutionId"
            label={t`Institution`}
            icon={<Icon name="account_balance" className="text-lg" />}
            error={errors.institutionId?.message}
            {...register('institutionId')}
          >
            <option value="">{t`Select an institution`}</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.countryCode})
              </option>
            ))}
          </Select>

          <TextInput
            id="accountName"
            label={t`Account Name`}
            placeholder={t`e.g. Main Checking`}
            icon={<Icon name="badge" className="text-lg" />}
            error={errors.accountName?.message}
            {...register('accountName')}
          />

          <TextInput
            id="currencyCode"
            label={t`Currency Code`}
            placeholder={t`e.g. USD, EUR, BRL`}
            icon={<Icon name="currency_exchange" className="text-lg" />}
            error={errors.currencyCode?.message}
            {...register('currencyCode')}
          />

          <Select
            id="accountType"
            label={t`Account Type`}
            icon={<Icon name="category" className="text-lg" />}
            error={errors.accountType?.message}
            {...register('accountType')}
          >
            <option value={AccountType.CHECKING}>{t`Checking`}</option>
            <option value={AccountType.SAVINGS}>{t`Savings`}</option>
            <option value={AccountType.CREDIT}>{t`Credit`}</option>
            <option value={AccountType.INVESTMENT}>{t`Investment`}</option>
          </Select>

          <TextInput
            id="balance"
            type="number"
            label={t`Initial Balance (cents)`}
            placeholder="0"
            icon={<Icon name="payments" className="text-lg" />}
            error={errors.balance?.message}
            {...register('balance', { valueAsNumber: true })}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              <Trans>Cancel</Trans>
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting ? <Trans>Creating...</Trans> : <Trans>Create Account</Trans>}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function EditAccountModal({
  account,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  account: BankAccount;
  onSubmit: (data: UpdateBankAccountInput) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const { t } = useLingui();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateBankAccountInput>({
    defaultValues: {
      accountName: account.accountName,
      balance: account.balance,
      accountType: account.accountType,
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card variant="default" padding="lg" className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-2xl font-bold text-primary">
            <Trans>Edit Account</Trans>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-xl text-on-surface-variant" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <TextInput
            id="editAccountName"
            label={t`Account Name`}
            placeholder={t`e.g. Main Checking`}
            icon={<Icon name="badge" className="text-lg" />}
            error={errors.accountName?.message}
            {...register('accountName')}
          />

          <Select
            id="editAccountType"
            label={t`Account Type`}
            icon={<Icon name="category" className="text-lg" />}
            error={errors.accountType?.message}
            {...register('accountType')}
          >
            <option value={AccountType.CHECKING}>{t`Checking`}</option>
            <option value={AccountType.SAVINGS}>{t`Savings`}</option>
            <option value={AccountType.CREDIT}>{t`Credit`}</option>
            <option value={AccountType.INVESTMENT}>{t`Investment`}</option>
          </Select>

          <TextInput
            id="editBalance"
            type="number"
            label={t`Balance (cents)`}
            placeholder="0"
            icon={<Icon name="payments" className="text-lg" />}
            error={errors.balance?.message}
            {...register('balance', { valueAsNumber: true })}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              <Trans>Cancel</Trans>
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting ? <Trans>Saving...</Trans> : <Trans>Save Changes</Trans>}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function DeleteConfirmModal({
  account,
  onConfirm,
  onClose,
  isDeleting,
}: {
  account: BankAccount;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card variant="default" padding="lg" className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <IconBox icon="warning" size="md" shape="circle" tone="error" />
          <h2 className="font-headline text-xl font-bold text-primary">
            <Trans>Delete Account</Trans>
          </h2>
        </div>
        <p className="text-on-surface-variant mb-6">
          <Trans>
            Are you sure you want to delete &ldquo;{account.accountName}&rdquo;? This action cannot
            be undone.
          </Trans>
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            <Trans>Cancel</Trans>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="!bg-error !text-white"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? <Trans>Deleting...</Trans> : <Trans>Delete</Trans>}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function AccountsOverviewPage({
  loadAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  loadAccountOverview,
  loadInstitutions,
}: Props) {
  const { t } = useLingui();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [totals, setTotals] = useState<CurrencyTotal[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const institutionMap = new Map(institutions.map((i) => [i.id, i.name]));

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [accountsData, overviewData, institutionsData] = await Promise.all([
        loadAccounts.execute(),
        loadAccountOverview.execute(),
        loadInstitutions.execute(),
      ]);
      setAccounts(accountsData);
      setTotals(overviewData.totalsByCurrency);
      setInstitutions(institutionsData);
    } catch {
      setError(t`Failed to load accounts. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [loadAccounts, loadAccountOverview, loadInstitutions, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (data: CreateBankAccountInput) => {
    setIsSubmitting(true);
    try {
      await createAccount.execute(data);
      setShowCreateModal(false);
      await fetchData();
    } catch {
      setError(t`Failed to create account.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: UpdateBankAccountInput) => {
    if (!editingAccount) return;
    setIsSubmitting(true);
    try {
      await updateAccount.execute(editingAccount.id, data);
      setEditingAccount(null);
      await fetchData();
    } catch {
      setError(t`Failed to update account.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAccount) return;
    setIsSubmitting(true);
    try {
      await deleteAccount.execute(deletingAccount.id);
      setDeletingAccount(null);
      await fetchData();
    } catch {
      setError(t`Failed to delete account.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <Icon name="hourglass_empty" className="text-4xl text-on-surface-variant animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        overline={<Trans>Financial Accounts</Trans>}
        title={<Trans>Accounts Overview</Trans>}
        actions={
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
          >
            <Icon name="add" className="text-lg mr-2" />
            <Trans>Add Account</Trans>
          </Button>
        }
      />

      {error && (
        <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
          {error}
        </div>
      )}

      <OverviewTotals totals={totals} />

      <div className="mb-6">
        <h2 className="font-headline text-xl font-bold text-primary mb-4">
          <Trans>Connected Accounts</Trans>
        </h2>
      </div>

      {accounts.length === 0 ? (
        <Card variant="default" padding="lg" className="text-center py-12">
          <IconBox
            icon="account_balance"
            size="lg"
            shape="circle"
            tone="surface"
            className="mx-auto mb-4"
          />
          <p className="text-on-surface-variant mb-4">
            <Trans>No accounts found. Add your first bank account to get started.</Trans>
          </p>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
          >
            <Icon name="add" className="text-lg mr-2" />
            <Trans>Add Account</Trans>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              institutionName={institutionMap.get(account.institutionId) ?? account.institutionId}
              onEdit={setEditingAccount}
              onDelete={setDeletingAccount}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAccountModal
          institutions={institutions}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onSubmit={handleUpdate}
          onClose={() => setEditingAccount(null)}
          isSubmitting={isSubmitting}
        />
      )}

      {deletingAccount && (
        <DeleteConfirmModal
          account={deletingAccount}
          onConfirm={handleDelete}
          onClose={() => setDeletingAccount(null)}
          isDeleting={isSubmitting}
        />
      )}
    </div>
  );
}
