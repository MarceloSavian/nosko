import type { BankAccount, SetSharedAccountsInput } from '@/domain/models/partnership/Partnership';

export interface ISetSharedAccounts {
  execute(input: SetSharedAccountsInput): Promise<BankAccount[]>;
}
