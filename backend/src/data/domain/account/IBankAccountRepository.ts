import type {
  BankAccountSchema,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '../../../domain/models/account/Account.js';

export interface IBankAccountRepository {
  findById(id: string): Promise<BankAccountSchema | null>;
  findByIds(ids: string[]): Promise<BankAccountSchema[]>;
  insert(input: CreateBankAccountInput): Promise<BankAccountSchema>;
  update(id: string, input: UpdateBankAccountInput): Promise<BankAccountSchema>;
  delete(id: string): Promise<void>;
  getOverviewByAccountIds(accountIds: string[]): Promise<{ currencyCode: string; total: number }[]>;
}
