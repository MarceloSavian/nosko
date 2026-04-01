import { mock } from 'node:test';
import type { IBankAccountRepository } from '../../data/domain/account/IBankAccountRepository.js';
import type {
  BankAccountSchema,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '../../domain/models/account/Account.js';

const defaultAccount: BankAccountSchema = {
  id: '',
  customerId: '',
  institutionId: '',
  accountName: '',
  accountNumberLast4: null,
  currencyCode: 'USD',
  balance: 0,
  accountType: null,
  balanceUpdatedAt: null,
  createdAt: '',
};

class MockBankAccountRepository implements IBankAccountRepository {
  findByCustomerId = mock.fn(async (_customerId: string): Promise<BankAccountSchema[]> => []);
  findById = mock.fn(async (_id: string): Promise<BankAccountSchema | null> => null);
  insert = mock.fn(
    async (_customerId: string, _input: CreateBankAccountInput): Promise<BankAccountSchema> => ({
      ...defaultAccount,
    }),
  );
  update = mock.fn(
    async (_id: string, _input: UpdateBankAccountInput): Promise<BankAccountSchema> => ({
      ...defaultAccount,
    }),
  );
  delete = mock.fn(async (_id: string): Promise<void> => {});
  getOverviewByCustomerId = mock.fn(
    async (_customerId: string): Promise<{ currencyCode: string; total: number }[]> => [],
  );
}

export const mockBankAccountRepository = new MockBankAccountRepository();
