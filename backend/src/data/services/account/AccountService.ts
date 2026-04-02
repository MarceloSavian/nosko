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
import type { IBankAccountOwnershipRepository } from '../../domain/account/IBankAccountOwnershipRepository.js';
import type { IBankAccountRepository } from '../../domain/account/IBankAccountRepository.js';

export class AccountService implements IAccountService {
  constructor(
    private readonly bankAccountRepository: IBankAccountRepository,
    private readonly ownershipRepository: IBankAccountOwnershipRepository,
  ) {}

  async listAccounts(customerId: string): Promise<BankAccountSchema[]> {
    const accountIds = await this.ownershipRepository.findAccountIdsByCustomerId(customerId);
    if (accountIds.length === 0) return [];
    return this.bankAccountRepository.findByIds(accountIds);
  }

  async getAccount(customerId: string, accountId: string): Promise<BankAccountSchema> {
    const account = await this.bankAccountRepository.findById(accountId);
    if (!account) throw new BankAccountNotFoundError();
    const isOwner = await this.ownershipRepository.isOwner(customerId, accountId);
    if (!isOwner) throw new BankAccountNotOwnedError();
    return account;
  }

  async createAccount(
    customerId: string,
    input: CreateBankAccountInput,
  ): Promise<BankAccountSchema> {
    const account = await this.bankAccountRepository.insert(input);
    await this.ownershipRepository.insert(account.id, customerId);
    return account;
  }

  async updateAccount(
    customerId: string,
    accountId: string,
    input: UpdateBankAccountInput,
  ): Promise<BankAccountSchema> {
    const account = await this.bankAccountRepository.findById(accountId);
    if (!account) throw new BankAccountNotFoundError();
    const isOwner = await this.ownershipRepository.isOwner(customerId, accountId);
    if (!isOwner) throw new BankAccountNotOwnedError();
    return await this.bankAccountRepository.update(accountId, input);
  }

  async deleteAccount(customerId: string, accountId: string): Promise<void> {
    const account = await this.bankAccountRepository.findById(accountId);
    if (!account) throw new BankAccountNotFoundError();
    const isOwner = await this.ownershipRepository.isOwner(customerId, accountId);
    if (!isOwner) throw new BankAccountNotOwnedError();
    await this.bankAccountRepository.delete(accountId);
  }
}
