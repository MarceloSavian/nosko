import type {
  AccountOverview,
  BankAccount,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '@/domain/models/account/Account';

export interface IAccountGateway {
  loadAll(): Promise<BankAccount[]>;
  create(input: CreateBankAccountInput): Promise<BankAccount>;
  update(id: string, input: UpdateBankAccountInput): Promise<BankAccount>;
  delete(id: string): Promise<void>;
  loadOverview(): Promise<AccountOverview>;
}
