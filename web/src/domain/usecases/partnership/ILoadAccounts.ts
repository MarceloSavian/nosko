import type { BankAccount } from '@/domain/models/partnership/Partnership';

export interface ILoadAccounts {
  execute(): Promise<BankAccount[]>;
}
