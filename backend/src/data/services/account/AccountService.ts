import {
  BankAccountNotFoundError,
  BankAccountNotOwnedError,
} from '../../../domain/errors/account.js';
import type {
  BankAccountSchema,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '../../../domain/models/account/Account.js';
import type { IAccountService } from '../../../domain/usecases/account/IAccountService.js';
import type { IBankAccountRepository } from '../../domain/account/IBankAccountRepository.js';

export class AccountService implements IAccountService {
  constructor(private readonly bankAccountRepository: IBankAccountRepository) {}

  async listAccounts(customerId: string): Promise<BankAccountSchema[]> {
    return await this.bankAccountRepository.findByCustomerId(customerId);
  }

  async getAccount(customerId: string, accountId: string): Promise<BankAccountSchema> {
    const account = await this.bankAccountRepository.findById(accountId);
    if (!account) throw new BankAccountNotFoundError();
    if (account.customerId !== customerId) throw new BankAccountNotOwnedError();
    return account;
  }

  async createAccount(
    customerId: string,
    input: CreateBankAccountInput,
  ): Promise<BankAccountSchema> {
    return await this.bankAccountRepository.insert(customerId, input);
  }

  async updateAccount(
    customerId: string,
    accountId: string,
    input: UpdateBankAccountInput,
  ): Promise<BankAccountSchema> {
    const account = await this.bankAccountRepository.findById(accountId);
    if (!account) throw new BankAccountNotFoundError();
    if (account.customerId !== customerId) throw new BankAccountNotOwnedError();
    return await this.bankAccountRepository.update(accountId, input);
  }

  async deleteAccount(customerId: string, accountId: string): Promise<void> {
    const account = await this.bankAccountRepository.findById(accountId);
    if (!account) throw new BankAccountNotFoundError();
    if (account.customerId !== customerId) throw new BankAccountNotOwnedError();
    await this.bankAccountRepository.delete(accountId);
  }

  async getOverview(
    customerId: string,
  ): Promise<{ totalsByCurrency: { currencyCode: string; total: string }[] }> {
    const totals = await this.bankAccountRepository.getOverviewByCustomerId(customerId);
    return { totalsByCurrency: totals };
  }
}
