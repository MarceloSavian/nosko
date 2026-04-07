import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { TransactionNotFoundError } from '@/domain/errors/transaction';
import {
  type CreateTransactionInput,
  type PaginatedTransactions,
  paginatedTransactionsSchema,
  type Transaction,
  transactionSchema,
  type UpdateTransactionInput,
} from '@/domain/models/transaction/Transaction';
import type { LoadTransactionsParams } from '@/domain/usecases/transaction/ILoadTransactions';

export class TransactionGateway implements ITransactionGateway {
  private readonly httpClient: IHttpClient;
  private readonly getToken: () => string | null;

  constructor(httpClient: IHttpClient, getToken: () => string | null) {
    this.httpClient = httpClient;
    this.getToken = getToken;
  }

  private authHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) throw new UnexpectedError();
    return { Authorization: `Bearer ${token}` };
  }

  async load(params: LoadTransactionsParams): Promise<PaginatedTransactions> {
    const searchParams = new URLSearchParams();
    searchParams.set('yearMonth', params.yearMonth);
    if (params.accountId) searchParams.set('accountId', params.accountId);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.offset !== undefined) searchParams.set('offset', String(params.offset));

    const response = await this.httpClient.request({
      url: `/v1/transactions?${searchParams.toString()}`,
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = paginatedTransactionsSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const response = await this.httpClient.request({
      url: '/v1/transactions',
      method: 'post',
      body: input,
      headers: this.authHeaders(),
    });

    if (response.statusCode === 201) {
      const parsed = transactionSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }

  async update(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    const response = await this.httpClient.request({
      url: `/v1/transactions/${id}`,
      method: 'put',
      body: input,
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = transactionSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    if (response.statusCode === 404) throw new TransactionNotFoundError();
    throw new UnexpectedError();
  }

  async remove(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/transactions/${id}`,
      method: 'delete',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 204) return;
    if (response.statusCode === 404) throw new TransactionNotFoundError();
    throw new UnexpectedError();
  }
}
