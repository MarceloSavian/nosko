import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { AccountNotFoundError, UnexpectedError } from '@/domain/errors/account';
import type {
  AccountOverview,
  BankAccount,
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from '@/domain/models/account/Account';

export class AccountGateway implements IAccountGateway {
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

  async loadAll(): Promise<BankAccount[]> {
    const response = await this.httpClient.request<BankAccount[]>({
      url: '/v1/accounts',
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }

  async create(input: CreateBankAccountInput): Promise<BankAccount> {
    const response = await this.httpClient.request<BankAccount>({
      url: '/v1/accounts',
      method: 'post',
      body: input,
      headers: this.authHeaders(),
    });

    if (response.statusCode === 201) return response.body;
    throw new UnexpectedError();
  }

  async update(id: string, input: UpdateBankAccountInput): Promise<BankAccount> {
    const response = await this.httpClient.request<BankAccount>({
      url: `/v1/accounts/${id}`,
      method: 'put',
      body: input,
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) return response.body;
    if (response.statusCode === 404) throw new AccountNotFoundError();
    throw new UnexpectedError();
  }

  async delete(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/accounts/${id}`,
      method: 'delete',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 204) return;
    if (response.statusCode === 404) throw new AccountNotFoundError();
    throw new UnexpectedError();
  }

  async loadOverview(): Promise<AccountOverview> {
    const response = await this.httpClient.request<AccountOverview>({
      url: '/v1/accounts/overview',
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }
}
