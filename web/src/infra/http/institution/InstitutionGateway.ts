import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import type { IInstitutionGateway } from '@/data/protocols/institution/IInstitutionGateway';
import { UnexpectedError } from '@/domain/errors/account';
import { type Institution, institutionSchema } from '@/domain/models/institution/Institution';

export class InstitutionGateway implements IInstitutionGateway {
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

  async loadAll(): Promise<Institution[]> {
    const response = await this.httpClient.request({
      url: '/v1/institutions',
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = institutionSchema.array().safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }
}
