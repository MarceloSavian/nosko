import type {
  IVerifyEmailGateway,
  VerifyEmailGatewayInput,
} from '@/data/protocols/auth/IVerifyEmailGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import {
  EmailAlreadyVerifiedError,
  InvalidVerificationCodeError,
  UnexpectedError,
  VerificationCodeExpiredError,
} from '@/domain/errors/auth';

export class VerifyEmailGateway implements IVerifyEmailGateway {
  private readonly httpClient: IHttpClient;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  async verifyEmail(input: VerifyEmailGatewayInput): Promise<void> {
    const response = await this.httpClient.request<{ message: string }>({
      url: '/v1/verify-email',
      method: 'post',
      body: input,
    });

    if (response.statusCode === 200) return;

    if (response.statusCode === 400) {
      const message = response.body?.message;
      if (message === 'Email already verified') throw new EmailAlreadyVerifiedError();
      if (message === 'Verification code expired') throw new VerificationCodeExpiredError();
      throw new InvalidVerificationCodeError();
    }

    throw new UnexpectedError();
  }
}
