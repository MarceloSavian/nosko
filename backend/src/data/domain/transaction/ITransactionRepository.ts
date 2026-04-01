import type {
  CreateTransactionInput,
  TransactionSchema,
  UpdateTransactionInput,
} from '../../../domain/models/transaction/Transaction.js';

export interface ITransactionRepository {
  findByFilters(filters: {
    bankAccountIds: string[];
    yearMonth?: string;
    categoryId?: string;
  }): Promise<TransactionSchema[]>;
  findById(id: string): Promise<TransactionSchema | null>;
  insert(input: CreateTransactionInput): Promise<TransactionSchema>;
  update(id: string, input: UpdateTransactionInput): Promise<TransactionSchema>;
  delete(id: string): Promise<void>;
}
