import type { PaginatedTransactions } from '@/domain/models/transaction/Transaction';

export type LoadTransactionsParams = {
  yearMonth: string;
  accountId?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
};

export interface ILoadTransactions {
  execute(params: LoadTransactionsParams): Promise<PaginatedTransactions>;
}
