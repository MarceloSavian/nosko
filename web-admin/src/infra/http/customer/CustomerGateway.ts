import type { ICustomerGateway } from '@/data/protocols/customer/ICustomerGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { CustomerNotFoundError, UnexpectedError } from '@/domain/errors/auth';
import type { CustomerListResult } from '@/domain/models/customer/Customer';

export class CustomerGateway implements ICustomerGateway {
  private readonly httpClient: IHttpClient;
  private readonly getToken: () => string | null;

  constructor(httpClient: IHttpClient, getToken: () => string | null) {
    this.httpClient = httpClient;
    this.getToken = getToken;
  }

  private authHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async list(limit: number, offset: number): Promise<CustomerListResult> {
    const response = await this.httpClient.request<CustomerListResult>({
      url: `/v1/admin/customers?limit=${limit}&offset=${offset}`,
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }

  async delete(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/admin/customers/${id}`,
      method: 'delete',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 204) return;
    if (response.statusCode === 404) throw new CustomerNotFoundError();
    throw new UnexpectedError();
  }
}
