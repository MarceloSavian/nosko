import type { IAdminGateway } from '@/data/protocols/admin/IAdminGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { AdminEmailConflictError, AdminNotFoundError, UnexpectedError } from '@/domain/errors/auth';
import type { AdminSchema, CreateAdminInput } from '@/domain/models/admin/Admin';

export class AdminGateway implements IAdminGateway {
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

  async list(): Promise<AdminSchema[]> {
    const response = await this.httpClient.request<AdminSchema[]>({
      url: '/v1/admin/admins',
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }

  async create(input: CreateAdminInput): Promise<AdminSchema> {
    const response = await this.httpClient.request<AdminSchema>({
      url: '/v1/admin/admins',
      method: 'post',
      body: input,
      headers: this.authHeaders(),
    });

    if (response.statusCode === 201) return response.body;
    if (response.statusCode === 409) throw new AdminEmailConflictError();
    throw new UnexpectedError();
  }

  async delete(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/admin/admins/${id}`,
      method: 'delete',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 204) return;
    if (response.statusCode === 404) throw new AdminNotFoundError();
    throw new UnexpectedError();
  }
}
