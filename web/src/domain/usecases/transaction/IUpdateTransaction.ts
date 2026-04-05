import type { Transaction, UpdateTransactionInput } from '@/domain/models/transaction/Transaction';

export interface IUpdateTransaction {
  execute(id: string, input: UpdateTransactionInput): Promise<Transaction>;
}
