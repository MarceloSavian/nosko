import { mock } from 'node:test';
import type {
  CreateTransactionInput,
  TransactionSchema,
  UpdateTransactionInput,
} from '../../domain/models/transaction/Transaction.js';
import type { ITransactionService } from '../../domain/usecases/transaction/ITransactionService.js';

const defaultTransaction: TransactionSchema = {
  id: '',
  bankAccountId: '',
  categoryId: null,
  budgetItemId: null,
  amount: '0',
  description: null,
  transactionDate: '',
  createdAt: '',
};

class MockTransactionService implements ITransactionService {
  listTransactions = mock.fn(
    async (
      _customerId: string,
      _filters: { yearMonth?: string; accountId?: string; categoryId?: string },
    ): Promise<TransactionSchema[]> => [],
  );
  createTransaction = mock.fn(
    async (_customerId: string, _input: CreateTransactionInput): Promise<TransactionSchema> => ({
      ...defaultTransaction,
    }),
  );
  updateTransaction = mock.fn(
    async (
      _customerId: string,
      _transactionId: string,
      _input: UpdateTransactionInput,
    ): Promise<TransactionSchema> => ({ ...defaultTransaction }),
  );
  deleteTransaction = mock.fn(
    async (_customerId: string, _transactionId: string): Promise<void> => {},
  );
}

export const mockTransactionService = new MockTransactionService();
