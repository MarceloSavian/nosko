import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PaginatedTransactions, Transaction } from '@/domain/models/transaction/Transaction';
import type { ICreateTransaction } from '@/domain/usecases/transaction/ICreateTransaction';
import type { IDeleteTransaction } from '@/domain/usecases/transaction/IDeleteTransaction';
import type { ILoadTransactions } from '@/domain/usecases/transaction/ILoadTransactions';
import type { IUpdateTransaction } from '@/domain/usecases/transaction/IUpdateTransaction';
import { renderWithI18n } from '@/test/i18n';
import { TransactionsPage } from './TransactionsPage';

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  bankAccountId: 'acc-1',
  categoryId: null,
  budgetItemId: null,
  amount: -5000,
  description: 'Grocery shopping',
  transactionDate: '2026-04-01',
  createdAt: '2026-04-01T10:00:00Z',
  ...overrides,
});

const makePaginatedResult = (
  data: Transaction[] = [makeTransaction()],
  overrides: Partial<PaginatedTransactions> = {},
): PaginatedTransactions => ({
  data,
  total: data.length,
  limit: 20,
  offset: 0,
  ...overrides,
});

describe('TransactionsPage', () => {
  const makeSut = (loadResult?: PaginatedTransactions) => {
    const loadTransactionsSpy: ILoadTransactions = { execute: vi.fn() };
    const createTransactionSpy: ICreateTransaction = { execute: vi.fn() };
    const updateTransactionSpy: IUpdateTransaction = { execute: vi.fn() };
    const deleteTransactionSpy: IDeleteTransaction = { execute: vi.fn() };

    vi.spyOn(loadTransactionsSpy, 'execute').mockResolvedValue(loadResult ?? makePaginatedResult());

    renderWithI18n(
      <TransactionsPage
        loadTransactions={loadTransactionsSpy}
        createTransaction={createTransactionSpy}
        updateTransaction={updateTransactionSpy}
        deleteTransaction={deleteTransactionSpy}
      />,
    );

    return {
      loadTransactionsSpy,
      createTransactionSpy,
      updateTransactionSpy,
      deleteTransactionSpy,
    };
  };

  describe('render', () => {
    it('should display the page heading', async () => {
      makeSut();
      expect(await screen.findByText('Transactions')).toBeInTheDocument();
    });

    it('should display the new transaction button', async () => {
      makeSut();
      expect(await screen.findByText('New Transaction')).toBeInTheDocument();
    });

    it('should display the month filter input', async () => {
      makeSut();
      await screen.findByText('Transactions');
      const monthInput = document.querySelector('input[type="month"]');
      expect(monthInput).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator while fetching', async () => {
      const loadTransactionsSpy: ILoadTransactions = { execute: vi.fn() };
      const createTransactionSpy: ICreateTransaction = { execute: vi.fn() };
      const updateTransactionSpy: IUpdateTransaction = { execute: vi.fn() };
      const deleteTransactionSpy: IDeleteTransaction = { execute: vi.fn() };

      vi.spyOn(loadTransactionsSpy, 'execute').mockImplementation(() => new Promise(() => {}));

      renderWithI18n(
        <TransactionsPage
          loadTransactions={loadTransactionsSpy}
          createTransaction={createTransactionSpy}
          updateTransaction={updateTransactionSpy}
          deleteTransaction={deleteTransactionSpy}
        />,
      );

      expect(await screen.findByText('Loading transactions...')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no transactions exist', async () => {
      makeSut(makePaginatedResult([]));

      expect(await screen.findByText('No transactions yet')).toBeInTheDocument();
      expect(
        screen.getByText('Add your first transaction to start tracking your finances.'),
      ).toBeInTheDocument();
    });

    it('should show add transaction button in empty state', async () => {
      makeSut(makePaginatedResult([]));

      expect(await screen.findByText('Add Transaction')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when loading fails', async () => {
      const loadTransactionsSpy: ILoadTransactions = { execute: vi.fn() };
      const createTransactionSpy: ICreateTransaction = { execute: vi.fn() };
      const updateTransactionSpy: IUpdateTransaction = { execute: vi.fn() };
      const deleteTransactionSpy: IDeleteTransaction = { execute: vi.fn() };

      vi.spyOn(loadTransactionsSpy, 'execute').mockRejectedValue(new Error('network error'));

      renderWithI18n(
        <TransactionsPage
          loadTransactions={loadTransactionsSpy}
          createTransaction={createTransactionSpy}
          updateTransaction={updateTransactionSpy}
          deleteTransaction={deleteTransactionSpy}
        />,
      );

      expect(
        await screen.findByText('Failed to load transactions. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  describe('display transactions', () => {
    it('should load and display transactions on mount', async () => {
      const { loadTransactionsSpy } = makeSut();

      expect(await screen.findByText('Grocery shopping')).toBeInTheDocument();
      expect(loadTransactionsSpy.execute).toHaveBeenCalledOnce();
    });

    it('should display transaction amount formatted as currency', async () => {
      makeSut();

      expect(await screen.findByText('-$50.00')).toBeInTheDocument();
    });

    it('should display formatted transaction date', async () => {
      makeSut();

      expect(await screen.findByText('Apr 1, 2026')).toBeInTheDocument();
    });

    it('should display "No description" for transactions without description', async () => {
      makeSut(makePaginatedResult([makeTransaction({ description: null })]));

      expect(await screen.findByText('No description')).toBeInTheDocument();
    });
  });

  describe('create transaction', () => {
    it('should open create modal when clicking new transaction button', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');
      await user.click(screen.getByText('New Transaction'));

      expect(screen.getByText('Create Transaction')).toBeInTheDocument();
    });

    it('should close create modal when clicking cancel', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');
      await user.click(screen.getByText('New Transaction'));
      expect(screen.getByText('Create Transaction')).toBeInTheDocument();

      const cancelButtons = screen.getAllByText('Cancel');
      await user.click(cancelButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Create Transaction')).not.toBeInTheDocument();
      });
    });

    const fillCreateForm = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.type(
        screen.getByLabelText('Bank Account ID'),
        '550e8400-e29b-41d4-a716-446655440000',
      );
      fireEvent.change(screen.getByLabelText('Amount (cents)'), { target: { value: '3000' } });
      await user.type(screen.getByLabelText('Description'), 'New item');
      fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-04-01' } });
      await user.type(screen.getByLabelText('Category ID'), '550e8400-e29b-41d4-a716-446655440001');
      await user.type(
        screen.getByLabelText('Budget Item ID'),
        '550e8400-e29b-41d4-a716-446655440002',
      );
    };

    it('should call createTransaction and add to list on success', async () => {
      const newTransaction = makeTransaction({
        id: 'tx-new',
        amount: 3000,
        description: 'New item',
        bankAccountId: '550e8400-e29b-41d4-a716-446655440000',
      });
      const { createTransactionSpy } = makeSut();
      vi.spyOn(createTransactionSpy, 'execute').mockResolvedValueOnce(newTransaction);
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');
      await user.click(screen.getByText('New Transaction'));
      await fillCreateForm(user);

      await user.click(screen.getByText('Create Transaction'));

      await waitFor(() => {
        expect(createTransactionSpy.execute).toHaveBeenCalled();
      });

      expect(await screen.findByText('New item')).toBeInTheDocument();
    });

    it('should show error when create fails', async () => {
      const { createTransactionSpy } = makeSut();
      vi.spyOn(createTransactionSpy, 'execute').mockRejectedValueOnce(new Error('fail'));
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');
      await user.click(screen.getByText('New Transaction'));
      await fillCreateForm(user);

      await user.click(screen.getByText('Create Transaction'));

      expect(
        await screen.findByText('Failed to create transaction. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  describe('edit transaction', () => {
    it('should show edit row when clicking edit button', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');

      const editButtons = document.querySelectorAll('button');
      const editButton = Array.from(editButtons).find(
        (btn) => btn.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'edit',
      );
      if (editButton) await user.click(editButton);

      expect(await screen.findByText('Save')).toBeInTheDocument();
    });

    it('should call updateTransaction and update list on save', async () => {
      const updatedTx = makeTransaction({
        amount: -9999,
        description: 'Updated description',
      });
      const { updateTransactionSpy } = makeSut();
      vi.spyOn(updateTransactionSpy, 'execute').mockResolvedValueOnce(updatedTx);
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');

      const editButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'edit',
      );
      if (editButton) await user.click(editButton);

      await screen.findByText('Save');

      const descriptionInput = screen.getByPlaceholderText('Description');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');

      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(updateTransactionSpy.execute).toHaveBeenCalledWith(
          'tx-1',
          expect.objectContaining({
            description: 'Updated description',
          }),
        );
      });

      expect(await screen.findByText('Updated description')).toBeInTheDocument();
    });

    it('should cancel editing when clicking cancel', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');

      const editButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'edit',
      );
      if (editButton) await user.click(editButton);

      await screen.findByText('Save');
      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Save')).not.toBeInTheDocument();
      });
    });

    it('should show error when update fails', async () => {
      const { updateTransactionSpy } = makeSut();
      vi.spyOn(updateTransactionSpy, 'execute').mockRejectedValueOnce(new Error('fail'));
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');

      const editButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'edit',
      );
      if (editButton) await user.click(editButton);

      await screen.findByText('Save');
      await user.click(screen.getByText('Save'));

      expect(await screen.findByText('Failed to update.')).toBeInTheDocument();
    });
  });

  describe('delete transaction', () => {
    it('should show delete confirmation modal when clicking delete button', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');

      const deleteButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'delete',
      );
      if (deleteButton) await user.click(deleteButton);

      expect(
        await screen.findByText(
          'Are you sure you want to delete this transaction? This action cannot be undone.',
        ),
      ).toBeInTheDocument();
    });

    it('should call deleteTransaction and remove from list on confirm', async () => {
      const { deleteTransactionSpy } = makeSut();
      vi.spyOn(deleteTransactionSpy, 'execute').mockResolvedValueOnce(undefined);
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');

      const deleteButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'delete',
      );
      if (deleteButton) await user.click(deleteButton);

      await screen.findByText('Delete Transaction');
      const confirmDeleteButtons = screen.getAllByText('Delete');
      const confirmButton = confirmDeleteButtons.find(
        (btn) => btn.closest('button') !== deleteButton,
      );
      if (confirmButton) await user.click(confirmButton);

      await waitFor(() => {
        expect(deleteTransactionSpy.execute).toHaveBeenCalledWith('tx-1');
      });

      await waitFor(() => {
        expect(screen.queryByText('Grocery shopping')).not.toBeInTheDocument();
      });
    });

    it('should close delete modal when clicking cancel', async () => {
      makeSut();
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');

      const deleteButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'delete',
      );
      if (deleteButton) await user.click(deleteButton);

      await screen.findByText('Delete Transaction');
      await user.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(
          screen.queryByText(
            'Are you sure you want to delete this transaction? This action cannot be undone.',
          ),
        ).not.toBeInTheDocument();
      });
    });

    it('should show error when delete fails', async () => {
      const { deleteTransactionSpy } = makeSut();
      vi.spyOn(deleteTransactionSpy, 'execute').mockRejectedValueOnce(new Error('fail'));
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');

      const deleteButton = Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.querySelector('.material-symbols-outlined')?.textContent?.trim() === 'delete',
      );
      if (deleteButton) await user.click(deleteButton);

      await screen.findByText('Delete Transaction');
      const confirmDeleteButtons = screen.getAllByText('Delete');
      const confirmButton = confirmDeleteButtons.find(
        (btn) => btn.closest('button') !== deleteButton,
      );
      if (confirmButton) await user.click(confirmButton);

      expect(await screen.findByText('Failed to delete transaction.')).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('should show load more button when there are more transactions', async () => {
      makeSut(makePaginatedResult([makeTransaction()], { total: 25 }));

      expect(await screen.findByText('Load More')).toBeInTheDocument();
    });

    it('should not show load more button when all transactions are loaded', async () => {
      makeSut(makePaginatedResult([makeTransaction()], { total: 1 }));

      await screen.findByText('Grocery shopping');
      expect(screen.queryByText('Load More')).not.toBeInTheDocument();
    });

    it('should load more transactions when clicking load more', async () => {
      const secondPage = makePaginatedResult(
        [makeTransaction({ id: 'tx-2', description: 'Second page item' })],
        { total: 25, offset: 20 },
      );
      const { loadTransactionsSpy } = makeSut(
        makePaginatedResult([makeTransaction()], { total: 25 }),
      );
      vi.spyOn(loadTransactionsSpy, 'execute').mockResolvedValueOnce(secondPage);
      const user = userEvent.setup();

      await screen.findByText('Load More');
      await user.click(screen.getByText('Load More'));

      await waitFor(() => {
        expect(loadTransactionsSpy.execute).toHaveBeenCalledTimes(2);
      });

      expect(await screen.findByText('Second page item')).toBeInTheDocument();
      expect(screen.getByText('Grocery shopping')).toBeInTheDocument();
    });
  });

  describe('month filter', () => {
    it('should reload transactions when month changes', async () => {
      const { loadTransactionsSpy } = makeSut();
      const user = userEvent.setup();

      await screen.findByText('Grocery shopping');

      const monthInput = document.querySelector('input[type="month"]') as HTMLInputElement;
      await user.clear(monthInput);
      await user.type(monthInput, '2026-03');

      await waitFor(() => {
        const calls = (loadTransactionsSpy.execute as ReturnType<typeof vi.fn>).mock.calls;
        const hasNewMonthCall = calls.some((call: unknown[]) => call[0]?.yearMonth === '2026-03');
        expect(hasNewMonthCall).toBe(true);
      });
    });
  });
});
