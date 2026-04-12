import type {
  IPasswordResetGateway,
  RequestPasswordResetGatewayInput,
  ResetPasswordGatewayInput,
} from '@/data/protocols/auth/IPasswordResetGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import {
  InvalidResetCodeError,
  ResetCodeExpiredError,
  UnexpectedError,
} from '@/domain/errors/auth';

export class PasswordResetGateway implements IPasswordResetGateway {
  private readonly httpClient: IHttpClient;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  async requestReset(input: RequestPasswordResetGatewayInput): Promise<void> {
    const response = await this.httpClient.request({
      url: '/v1/admin/request-password-reset',
      method: 'post',
      body: input,
    });

    if (response.statusCode === 200) return;
    throw new UnexpectedError();
  }

  async resetPassword(input: ResetPasswordGatewayInput): Promise<void> {
    const response = await this.httpClient.request<{ message: string }>({
      url: '/v1/admin/reset-password',
      method: 'post',
      body: input,
    });

    if (response.statusCode === 200) return;
    if (response.statusCode === 400) {
      const body = response.body;
      if (body.message?.includes('expired')) throw new ResetCodeExpiredError();
      throw new InvalidResetCodeError();
    }
    throw new UnexpectedError();
  }
}
