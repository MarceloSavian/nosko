import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import type { IInstitutionGateway } from '@/data/protocols/institution/IInstitutionGateway';
import { InstitutionNotFoundError, UnexpectedError } from '@/domain/errors/auth';
import type {
  CreateInstitutionInput,
  InstitutionSchema,
  UpdateInstitutionInput,
} from '@/domain/models/institution/Institution';

export class InstitutionGateway implements IInstitutionGateway {
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

  async list(): Promise<InstitutionSchema[]> {
    const response = await this.httpClient.request<InstitutionSchema[]>({
      url: '/v1/admin/institutions',
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) return response.body;
    throw new UnexpectedError();
  }

  async create(input: CreateInstitutionInput): Promise<InstitutionSchema> {
    const response = await this.httpClient.request<InstitutionSchema>({
      url: '/v1/admin/institutions',
      method: 'post',
      body: input,
      headers: this.authHeaders(),
    });

    if (response.statusCode === 201) return response.body;
    throw new UnexpectedError();
  }

  async update(id: string, input: UpdateInstitutionInput): Promise<InstitutionSchema> {
    const response = await this.httpClient.request<InstitutionSchema>({
      url: `/v1/admin/institutions/${id}`,
      method: 'put',
      body: input,
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) return response.body;
    if (response.statusCode === 404) throw new InstitutionNotFoundError();
    throw new UnexpectedError();
  }

  async delete(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/admin/institutions/${id}`,
      method: 'delete',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 204) return;
    if (response.statusCode === 404) throw new InstitutionNotFoundError();
    throw new UnexpectedError();
  }
}
