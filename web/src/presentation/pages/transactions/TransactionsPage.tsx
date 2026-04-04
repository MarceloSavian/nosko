import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Transaction } from '@/domain/models/transaction/Transaction';
import {
  type CreateTransactionInput,
  createTransactionInputSchema,
} from '@/domain/models/transaction/Transaction';
import type { ICreateTransaction } from '@/domain/usecases/transaction/ICreateTransaction';
import type { IDeleteTransaction } from '@/domain/usecases/transaction/IDeleteTransaction';
import type { ILoadTransactions } from '@/domain/usecases/transaction/ILoadTransactions';
import type { IUpdateTransaction } from '@/domain/usecases/transaction/IUpdateTransaction';
import { Button } from '@/presentation/components/Button';
import { Card } from '@/presentation/components/Card';
import { Icon } from '@/presentation/components/Icon';
import { TextInput } from '@/presentation/components/TextInput';

type Props = {
  loadTransactions: ILoadTransactions;
  createTransaction: ICreateTransaction;
  updateTransaction: IUpdateTransaction;
  deleteTransaction: IDeleteTransaction;
};

function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatCurrency(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

const PAGE_SIZE = 20;

export function TransactionsPage({
  loadTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
}: Props) {
  const { t } = useLingui();
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchTransactions = useCallback(
    async (newOffset: number, append = false) => {
      setLoading(true);
      setError('');
      try {
        const result = await loadTransactions.execute({
          yearMonth,
          limit: PAGE_SIZE,
          offset: newOffset,
        });
        setTransactions((prev) => (append ? [...prev, ...result.data] : result.data));
        setTotal(result.total);
        setOffset(newOffset);
      } catch {
        setError(t`Failed to load transactions. Please try again.`);
      } finally {
        setLoading(false);
      }
    },
    [loadTransactions, yearMonth, t],
  );

  useEffect(() => {
    fetchTransactions(0);
  }, [fetchTransactions]);

  const handleLoadMore = () => {
    fetchTransactions(offset + PAGE_SIZE, true);
  };

  const handleCreated = (tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);
    setTotal((prev) => prev + 1);
    setShowCreateModal(false);
  };

  const handleUpdated = (tx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
    setEditingId(null);
  };

  const handleDeleted = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setTotal((prev) => prev - 1);
    setDeletingId(null);
  };

  const hasMore = transactions.length < total;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase font-semibold tracking-widest text-primary/60 mb-1">
            <Trans>Financial Records</Trans>
          </p>
          <h1 className="font-headline text-3xl font-bold text-primary tracking-tight">
            <Trans>Transactions</Trans>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="bg-surface-container-highest border-none rounded-2xl py-3 px-4 text-on-surface font-medium focus:ring-2 focus:ring-tertiary/20 outline-none"
          />
          <Button variant="secondary" size="md" onClick={() => setShowCreateModal(true)}>
            <Icon name="add" className="text-lg mr-2" />
            <Trans>New Transaction</Trans>
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 rounded-xl text-error text-sm font-medium">
          {error}
        </div>
      )}

      {showCreateModal && (
        <CreateTransactionModal
          createTransaction={createTransaction}
          onCreated={handleCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {deletingId && (
        <DeleteConfirmationModal
          deleteTransaction={deleteTransaction}
          transactionId={deletingId}
          onDeleted={handleDeleted}
          onClose={() => setDeletingId(null)}
        />
      )}

      {!loading && transactions.length === 0 && !error && (
        <Card variant="default" padding="xl" className="text-center">
          <Icon name="receipt_long" className="text-6xl text-primary/20 mb-4" />
          <h3 className="font-headline text-xl font-bold text-primary mb-2">
            <Trans>No transactions yet</Trans>
          </h3>
          <p className="text-on-surface-variant text-sm mb-6">
            <Trans>Add your first transaction to start tracking your finances.</Trans>
          </p>
          <Button variant="secondary" size="md" onClick={() => setShowCreateModal(true)}>
            <Icon name="add" className="text-lg mr-2" />
            <Trans>Add Transaction</Trans>
          </Button>
        </Card>
      )}

      {transactions.length > 0 && (
        <Card variant="default" padding="none">
          <div className="divide-y divide-surface-container-highest">
            {transactions.map((tx) =>
              editingId === tx.id ? (
                <EditTransactionRow
                  key={tx.id}
                  transaction={tx}
                  updateTransaction={updateTransaction}
                  onUpdated={handleUpdated}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  onEdit={() => setEditingId(tx.id)}
                  onDelete={() => setDeletingId(tx.id)}
                />
              ),
            )}
          </div>
          {hasMore && (
            <div className="p-4 text-center border-t border-surface-container-highest">
              <Button variant="ghost" size="sm" onClick={handleLoadMore} disabled={loading}>
                {loading ? <Trans>Loading...</Trans> : <Trans>Load More</Trans>}
              </Button>
            </div>
          )}
        </Card>
      )}

      {loading && transactions.length === 0 && (
        <div className="text-center py-12">
          <Icon name="hourglass_empty" className="text-4xl text-primary/30 animate-spin" />
          <p className="text-on-surface-variant text-sm mt-4">
            <Trans>Loading transactions...</Trans>
          </p>
        </div>
      )}
    </div>
  );
}

type TransactionRowProps = {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
};

function TransactionRow({ transaction, onEdit, onDelete }: TransactionRowProps) {
  const isNegative = transaction.amount < 0;

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-high/50 transition-colors group">
      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
        <Icon
          name={isNegative ? 'arrow_upward' : 'arrow_downward'}
          className={`text-xl ${isNegative ? 'text-error' : 'text-tertiary'}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-primary truncate">
          {transaction.description || <Trans>No description</Trans>}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-outline">
          {formatDate(transaction.transactionDate)}
        </p>
      </div>
      <p className={`font-bold text-sm shrink-0 ${isNegative ? 'text-error' : 'text-tertiary'}`}>
        {formatCurrency(transaction.amount)}
      </p>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-surface-container-highest transition-colors cursor-pointer"
        >
          <Icon name="edit" className="text-lg text-primary/60" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-error/10 transition-colors cursor-pointer"
        >
          <Icon name="delete" className="text-lg text-error/60" />
        </button>
      </div>
    </div>
  );
}

type CreateTransactionModalProps = {
  createTransaction: ICreateTransaction;
  onCreated: (tx: Transaction) => void;
  onClose: () => void;
};

function CreateTransactionModal({
  createTransaction,
  onCreated,
  onClose,
}: CreateTransactionModalProps) {
  const { t } = useLingui();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionInputSchema),
  });

  const onSubmit = async (data: CreateTransactionInput) => {
    setServerError('');
    try {
      const tx = await createTransaction.execute(data);
      onCreated(tx);
    } catch {
      setServerError(t`Failed to create transaction. Please try again.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card variant="default" padding="lg" className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold text-primary">
            <Trans>New Transaction</Trans>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container-highest transition-colors cursor-pointer"
          >
            <Icon name="close" className="text-xl text-primary/60" />
          </button>
        </div>

        {serverError && (
          <div className="mb-4 p-3 bg-error/10 rounded-xl text-error text-sm font-medium">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <TextInput
            id="bankAccountId"
            label={t`Bank Account ID`}
            placeholder={t`Enter bank account ID`}
            icon={<Icon name="account_balance" className="text-lg" />}
            error={errors.bankAccountId?.message}
            {...register('bankAccountId')}
          />

          <TextInput
            id="amount"
            type="number"
            label={t`Amount (cents)`}
            placeholder={t`e.g. -5000 for $50.00`}
            icon={<Icon name="payments" className="text-lg" />}
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />

          <TextInput
            id="description"
            label={t`Description`}
            placeholder={t`What was this transaction for?`}
            icon={<Icon name="description" className="text-lg" />}
            error={errors.description?.message}
            {...register('description')}
          />

          <TextInput
            id="transactionDate"
            type="date"
            label={t`Date`}
            icon={<Icon name="calendar_today" className="text-lg" />}
            error={errors.transactionDate?.message}
            {...register('transactionDate')}
          />

          <TextInput
            id="categoryId"
            label={t`Category ID`}
            placeholder={t`Optional`}
            icon={<Icon name="category" className="text-lg" />}
            error={errors.categoryId?.message}
            {...register('categoryId')}
          />

          <TextInput
            id="budgetItemId"
            label={t`Budget Item ID`}
            placeholder={t`Optional`}
            icon={<Icon name="receipt" className="text-lg" />}
            error={errors.budgetItemId?.message}
            {...register('budgetItemId')}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              <Trans>Cancel</Trans>
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="md"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Trans>Creating...</Trans> : <Trans>Create Transaction</Trans>}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

type EditTransactionRowProps = {
  transaction: Transaction;
  updateTransaction: IUpdateTransaction;
  onUpdated: (tx: Transaction) => void;
  onCancel: () => void;
};

function EditTransactionRow({
  transaction,
  updateTransaction,
  onUpdated,
  onCancel,
}: EditTransactionRowProps) {
  const { t } = useLingui();
  const [editAmount, setEditAmount] = useState(String(transaction.amount));
  const [editDescription, setEditDescription] = useState(transaction.description ?? '');
  const [editDate, setEditDate] = useState(transaction.transactionDate);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setEditError('');
    try {
      const updated = await updateTransaction.execute(transaction.id, {
        amount: Number(editAmount),
        description: editDescription || undefined,
        transactionDate: editDate,
      });
      onUpdated(updated);
    } catch {
      setEditError(t`Failed to update.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 py-4 bg-tertiary/5">
      {editError && <p className="text-error text-xs mb-2">{editError}</p>}
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          className="w-32 bg-surface-container-highest border-none rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-tertiary/20 outline-none"
          placeholder={t`Amount`}
        />
        <input
          type="text"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          className="flex-1 bg-surface-container-highest border-none rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-tertiary/20 outline-none"
          placeholder={t`Description`}
        />
        <input
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          className="bg-surface-container-highest border-none rounded-xl py-2 px-3 text-sm font-medium focus:ring-2 focus:ring-tertiary/20 outline-none"
        />
        <Button variant="secondary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Trans>Saving...</Trans> : <Trans>Save</Trans>}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <Trans>Cancel</Trans>
        </Button>
      </div>
    </div>
  );
}

type DeleteConfirmationModalProps = {
  deleteTransaction: IDeleteTransaction;
  transactionId: string;
  onDeleted: (id: string) => void;
  onClose: () => void;
};

function DeleteConfirmationModal({
  deleteTransaction,
  transactionId,
  onDeleted,
  onClose,
}: DeleteConfirmationModalProps) {
  const { t } = useLingui();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteTransaction.execute(transactionId);
      onDeleted(transactionId);
    } catch {
      setDeleteError(t`Failed to delete transaction.`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Card variant="default" padding="lg" className="w-full max-w-sm text-center">
        <Icon name="warning" className="text-5xl text-error mb-4" />
        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          <Trans>Delete Transaction</Trans>
        </h2>
        <p className="text-on-surface-variant text-sm mb-6">
          <Trans>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </Trans>
        </p>
        {deleteError && <p className="text-error text-sm mb-4">{deleteError}</p>}
        <div className="flex gap-3 justify-center">
          <Button variant="ghost" size="md" onClick={onClose}>
            <Trans>Cancel</Trans>
          </Button>
          <Button
            variant="primary"
            size="md"
            className="bg-error hover:bg-error/90 text-white"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Trans>Deleting...</Trans> : <Trans>Delete</Trans>}
          </Button>
        </div>
      </Card>
    </div>
  );
}
