import type {
  CreateTransactionInput,
  TransactionSchema,
  UpdateTransactionInput,
} from '../../models/transaction/Transaction.js';

export interface ITransactionService {
  listTransactions(
    customerId: string,
    filters: { yearMonth?: string; accountId?: string; categoryId?: string },
  ): Promise<TransactionSchema[]>;
  createTransaction(customerId: string, input: CreateTransactionInput): Promise<TransactionSchema>;
  updateTransaction(
    customerId: string,
    transactionId: string,
    input: UpdateTransactionInput,
  ): Promise<TransactionSchema>;
  deleteTransaction(customerId: string, transactionId: string): Promise<void>;
}
