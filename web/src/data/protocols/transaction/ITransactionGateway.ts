import type {
  CreateTransactionInput,
  PaginatedTransactions,
  Transaction,
  UpdateTransactionInput,
} from '@/domain/models/transaction/Transaction';
import type { LoadTransactionsParams } from '@/domain/usecases/transaction/ILoadTransactions';

export interface ITransactionGateway {
  load(params: LoadTransactionsParams): Promise<PaginatedTransactions>;
  create(input: CreateTransactionInput): Promise<Transaction>;
  update(id: string, input: UpdateTransactionInput): Promise<Transaction>;
  remove(id: string): Promise<void>;
}
