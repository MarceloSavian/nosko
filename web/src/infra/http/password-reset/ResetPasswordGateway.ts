import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import type {
  IResetPasswordGateway,
  ResetPasswordGatewayInput,
} from '@/data/protocols/password-reset/IResetPasswordGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { InvalidResetCodeError, ResetCodeExpiredError } from '@/domain/errors/password-reset';

export class ResetPasswordGateway implements IResetPasswordGateway {
  private readonly httpClient: IHttpClient;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  async resetPassword(input: ResetPasswordGatewayInput): Promise<void> {
    const response = await this.httpClient.request({
      url: '/v1/reset-password',
      method: 'post',
      body: input,
    });

    if (response.statusCode === 200) return;
    if (response.statusCode === 400) throw new InvalidResetCodeError();
    if (response.statusCode === 410) throw new ResetCodeExpiredError();

    throw new UnexpectedError();
  }
}
