import type { BankAccount, UpdateBankAccountInput } from '@/domain/models/account/Account';

export interface IUpdateAccount {
  execute(id: string, input: UpdateBankAccountInput): Promise<BankAccount>;
}
