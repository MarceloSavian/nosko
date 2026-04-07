import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import type {
  IRequestPasswordResetGateway,
  RequestPasswordResetGatewayInput,
} from '@/data/protocols/password-reset/IRequestPasswordResetGateway';
import { UnexpectedError } from '@/domain/errors/auth';

export class RequestPasswordResetGateway implements IRequestPasswordResetGateway {
  private readonly httpClient: IHttpClient;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  async requestReset(input: RequestPasswordResetGatewayInput): Promise<void> {
    const response = await this.httpClient.request({
      url: '/v1/request-password-reset',
      method: 'post',
      body: input,
    });

    if (response.statusCode === 200) return;

    throw new UnexpectedError();
  }
}
