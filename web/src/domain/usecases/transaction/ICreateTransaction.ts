import type { CreateTransactionInput, Transaction } from '@/domain/models/transaction/Transaction';

export interface ICreateTransaction {
  execute(input: CreateTransactionInput): Promise<Transaction>;
}
