import type { BankAccount, CreateBankAccountInput } from '@/domain/models/account/Account';

export interface ICreateAccount {
  execute(input: CreateBankAccountInput): Promise<BankAccount>;
}
