import type {
  BankAccountSchema,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '../../models/account/Account.js';

export interface IAccountService {
  listAccounts(customerId: string): Promise<BankAccountSchema[]>;
  getAccount(customerId: string, accountId: string): Promise<BankAccountSchema>;
  createAccount(customerId: string, input: CreateBankAccountInput): Promise<BankAccountSchema>;
  updateAccount(
    customerId: string,
    accountId: string,
    input: UpdateBankAccountInput,
  ): Promise<BankAccountSchema>;
  deleteAccount(customerId: string, accountId: string): Promise<void>;
}
