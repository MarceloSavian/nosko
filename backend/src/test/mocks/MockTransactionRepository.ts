import { mock } from 'node:test';
import type { ITransactionRepository } from '../../data/domain/transaction/ITransactionRepository.js';
import type { PaginatedResult, PaginationInput } from '../../domain/models/shared/Pagination.js';
import type {
  CreateTransactionInput,
  TransactionSchema,
  UpdateTransactionInput,
} from '../../domain/models/transaction/Transaction.js';

const defaultTransaction: TransactionSchema = {
  id: '',
  bankAccountId: '',
  categoryId: null,
  budgetItemId: null,
  amount: 0,
  description: null,
  transactionDate: '',
  createdAt: '',
};

class MockTransactionRepository implements ITransactionRepository {
  findByFilters = mock.fn(
    async (
      _filters: {
        bankAccountIds: string[];
        yearMonth?: string;
        categoryId?: string;
      },
      _pagination: PaginationInput,
    ): Promise<PaginatedResult<TransactionSchema>> => ({
      data: [],
      total: 0,
      limit: 50,
      offset: 0,
    }),
  );
  findById = mock.fn(async (_id: string): Promise<TransactionSchema | null> => null);
  insert = mock.fn(
    async (_input: CreateTransactionInput): Promise<TransactionSchema> => ({
      ...defaultTransaction,
    }),
  );
  update = mock.fn(
    async (_id: string, _input: UpdateTransactionInput): Promise<TransactionSchema> => ({
      ...defaultTransaction,
    }),
  );
  delete = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockTransactionRepository = new MockTransactionRepository();
