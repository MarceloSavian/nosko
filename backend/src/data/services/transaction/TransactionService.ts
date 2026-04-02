import {
  BankAccountNotFoundError,
  BankAccountNotOwnedError,
} from '../../../domain/errors/account.js';
import { TransactionNotFoundError } from '../../../domain/errors/transaction.js';
import type { PaginatedResult, PaginationInput } from '../../../domain/models/shared/Pagination.js';
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
    pagination: PaginationInput,
  ): Promise<PaginatedResult<TransactionSchema>> {
    let bankAccountIds: string[];

    if (filters.accountId) {
      const account = await this.bankAccountRepository.findById(filters.accountId);
      if (!account || account.customerId !== customerId)
        return { data: [], total: 0, limit: pagination.limit, offset: pagination.offset };
      bankAccountIds = [filters.accountId];
    } else {
      const accounts = await this.bankAccountRepository.findByCustomerId(customerId);
      bankAccountIds = accounts.map((a) => a.id);
    }

    if (bankAccountIds.length === 0)
      return { data: [], total: 0, limit: pagination.limit, offset: pagination.offset };

    return await this.transactionRepository.findByFilters(
      {
        bankAccountIds,
        yearMonth: filters.yearMonth,
        categoryId: filters.categoryId,
      },
      pagination,
    );
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
