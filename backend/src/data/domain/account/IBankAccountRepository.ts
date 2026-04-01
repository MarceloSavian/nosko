import type {
  BankAccountSchema,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '../../../domain/models/account/Account.js';

export interface IBankAccountRepository {
  findByCustomerId(customerId: string): Promise<BankAccountSchema[]>;
  findById(id: string): Promise<BankAccountSchema | null>;
  insert(customerId: string, input: CreateBankAccountInput): Promise<BankAccountSchema>;
  update(id: string, input: UpdateBankAccountInput): Promise<BankAccountSchema>;
  delete(id: string): Promise<void>;
  getOverviewByCustomerId(customerId: string): Promise<{ currencyCode: string; total: string }[]>;
}
