import type { BankAccount } from '@/domain/models/partnership/Partnership';

export interface ILoadSharedAccounts {
  execute(): Promise<BankAccount[]>;
}
