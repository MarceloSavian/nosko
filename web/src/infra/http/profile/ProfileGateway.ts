import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import type { IProfileGateway } from '@/data/protocols/profile/IProfileGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import {
  type CurrencyDefaultSchema,
  type CustomerSchema,
  currencyDefaultSchema,
  customerSchema,
  type SetCurrencyDefaultsInput,
  type UpdateProfileInput,
} from '@/domain/models/profile/Profile';

export class ProfileGateway implements IProfileGateway {
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

  async loadProfile(): Promise<CustomerSchema> {
    const response = await this.httpClient.request({
      url: '/v1/me',
      method: 'get',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) {
      const parsed = customerSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }

  async updateProfile(input: UpdateProfileInput): Promise<CustomerSchema> {
    const response = await this.httpClient.request({
      url: '/v1/me',
      method: 'put',
      body: input,
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) {
      const parsed = customerSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }

  async deleteAccount(): Promise<void> {
    const response = await this.httpClient.request({
      url: '/v1/me',
      method: 'delete',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 204) return;
    throw new UnexpectedError();
  }

  async loadCurrencyDefaults(): Promise<CurrencyDefaultSchema[]> {
    const response = await this.httpClient.request({
      url: '/v1/me/currencies',
      method: 'get',
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) {
      const parsed = currencyDefaultSchema.array().safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }

  async setCurrencyDefaults(input: SetCurrencyDefaultsInput): Promise<CurrencyDefaultSchema[]> {
    const response = await this.httpClient.request({
      url: '/v1/me/currencies',
      method: 'put',
      body: input,
      headers: this.authHeaders(),
    });
    if (response.statusCode === 200) {
      const parsed = currencyDefaultSchema.array().safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }
}
