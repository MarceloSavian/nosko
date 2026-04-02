import type { PaginatedResult, PaginationInput } from '../../../domain/models/shared/Pagination.js';
import type {
  CreateTransactionInput,
  TransactionSchema,
  UpdateTransactionInput,
} from '../../../domain/models/transaction/Transaction.js';

export interface ITransactionRepository {
  findByFilters(
    filters: {
      bankAccountIds: string[];
      yearMonth?: string;
      categoryId?: string;
    },
    pagination: PaginationInput,
  ): Promise<PaginatedResult<TransactionSchema>>;
  findById(id: string): Promise<TransactionSchema | null>;
  insert(input: CreateTransactionInput): Promise<TransactionSchema>;
  update(id: string, input: UpdateTransactionInput): Promise<TransactionSchema>;
  delete(id: string): Promise<void>;
}
