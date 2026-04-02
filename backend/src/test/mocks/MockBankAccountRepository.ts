import { mock } from 'node:test';
import type { IBankAccountRepository } from '../../data/domain/account/IBankAccountRepository.js';
import type {
  BankAccountSchema,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '../../domain/models/account/Account.js';

const defaultAccount: BankAccountSchema = {
  id: '',
  institutionId: '',
  accountName: '',
  currencyCode: 'USD',
  balance: 0,
  accountType: 'CHECKING',
  balanceUpdatedAt: null,
  createdAt: '',
};

class MockBankAccountRepository implements IBankAccountRepository {
  findById = mock.fn(async (_id: string): Promise<BankAccountSchema | null> => null);
  findByIds = mock.fn(async (_ids: string[]): Promise<BankAccountSchema[]> => []);
  insert = mock.fn(
    async (_input: CreateBankAccountInput): Promise<BankAccountSchema> => ({
      ...defaultAccount,
    }),
  );
  update = mock.fn(
    async (_id: string, _input: UpdateBankAccountInput): Promise<BankAccountSchema> => ({
      ...defaultAccount,
    }),
  );
  delete = mock.fn(async (_id: string): Promise<void> => {});
  getOverviewByAccountIds = mock.fn(
    async (_accountIds: string[]): Promise<{ currencyCode: string; total: number }[]> => [],
  );
}

export const mockBankAccountRepository = new MockBankAccountRepository();
