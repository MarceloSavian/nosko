import type { ILoginGateway, LoginGatewayInput } from '@/data/protocols/auth/ILoginGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import {
  AdminPasswordNotSetError,
  InvalidCredentialsError,
  UnexpectedError,
} from '@/domain/errors/auth';
import type { LoginResult } from '@/domain/models/auth/Auth';

export class LoginGateway implements ILoginGateway {
  private readonly httpClient: IHttpClient;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  async login(input: LoginGatewayInput): Promise<LoginResult> {
    const response = await this.httpClient.request<LoginResult>({
      url: '/v1/admin/login',
      method: 'post',
      body: input,
    });

    if (response.statusCode === 200) return response.body;
    if (response.statusCode === 401) throw new InvalidCredentialsError();
    if (response.statusCode === 403) throw new AdminPasswordNotSetError();
    throw new UnexpectedError();
  }
}
