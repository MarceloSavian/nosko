import { mock } from 'node:test';
import type {
  BankAccountSchema,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '../../domain/models/account/Account.js';
import type { IAccountService } from '../../domain/usecases/account/IAccountService.js';

const defaultAccount: BankAccountSchema = {
  id: '',
  institutionId: '',
  accountName: '',
  accountNumberLast4: null,
  currencyCode: 'USD',
  balance: 0,
  accountType: null,
  balanceUpdatedAt: null,
  createdAt: '',
};

class MockAccountService implements IAccountService {
  listAccounts = mock.fn(async (_customerId: string): Promise<BankAccountSchema[]> => []);
  getAccount = mock.fn(
    async (_customerId: string, _accountId: string): Promise<BankAccountSchema> => ({
      ...defaultAccount,
    }),
  );
  createAccount = mock.fn(
    async (_customerId: string, _input: CreateBankAccountInput): Promise<BankAccountSchema> => ({
      ...defaultAccount,
    }),
  );
  updateAccount = mock.fn(
    async (
      _customerId: string,
      _accountId: string,
      _input: UpdateBankAccountInput,
    ): Promise<BankAccountSchema> => ({ ...defaultAccount }),
  );
  deleteAccount = mock.fn(async (_customerId: string, _accountId: string): Promise<void> => {});
}

export const mockAccountService = new MockAccountService();
