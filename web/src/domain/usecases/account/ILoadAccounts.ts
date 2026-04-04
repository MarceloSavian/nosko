import type { BankAccount } from '@/domain/models/account/Account';

export interface ILoadAccounts {
  execute(): Promise<BankAccount[]>;
}
