import {
  BankAccountNotFoundError,
  BankAccountNotOwnedError,
} from '../../../domain/errors/account.js';
import { TransactionNotFoundError } from '../../../domain/errors/transaction.js';
import type {
  CreateTransactionInput,
  TransactionSchema,
  UpdateTransactionInput,
} from '../../../domain/models/transaction/Transaction.js';
import type { ITransactionService } from '../../../domain/usecases/transaction/ITransactionService.js';
import type { IBankAccountRepository } from '../../domain/account/IBankAccountRepository.js';
import type { ITransactionRepository } from '../../domain/transaction/ITransactionRepository.js';

export class TransactionService implements ITransactionService {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly bankAccountRepository: IBankAccountRepository,
  ) {}

  async listTransactions(
    customerId: string,
    filters: { yearMonth?: string; accountId?: string; categoryId?: string },
  ): Promise<TransactionSchema[]> {
    let bankAccountIds: string[];

    if (filters.accountId) {
      const account = await this.bankAccountRepository.findById(filters.accountId);
      if (!account || account.customerId !== customerId) return [];
      bankAccountIds = [filters.accountId];
    } else {
      const accounts = await this.bankAccountRepository.findByCustomerId(customerId);
      bankAccountIds = accounts.map((a) => a.id);
    }

    if (bankAccountIds.length === 0) return [];

    return await this.transactionRepository.findByFilters({
      bankAccountIds,
      yearMonth: filters.yearMonth,
      categoryId: filters.categoryId,
    });
  }

  async createTransaction(
    customerId: string,
    input: CreateTransactionInput,
  ): Promise<TransactionSchema> {
    const account = await this.bankAccountRepository.findById(input.bankAccountId);
    if (!account) throw new BankAccountNotFoundError();
    if (account.customerId !== customerId) throw new BankAccountNotOwnedError();

    return await this.transactionRepository.insert(input);
  }

  async updateTransaction(
    customerId: string,
    transactionId: string,
    input: UpdateTransactionInput,
  ): Promise<TransactionSchema> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) throw new TransactionNotFoundError();

    const account = await this.bankAccountRepository.findById(transaction.bankAccountId);
    if (!account || account.customerId !== customerId) throw new TransactionNotFoundError();

    return await this.transactionRepository.update(transactionId, input);
  }

  async deleteTransaction(customerId: string, transactionId: string): Promise<void> {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) throw new TransactionNotFoundError();

    const account = await this.bankAccountRepository.findById(transaction.bankAccountId);
    if (!account || account.customerId !== customerId) throw new TransactionNotFoundError();

    await this.transactionRepository.delete(transactionId);
  }
}
