import type {
  IResendVerificationGateway,
  ResendVerificationGatewayInput,
} from '@/data/protocols/auth/IResendVerificationGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { EmailAlreadyVerifiedError, UnexpectedError } from '@/domain/errors/auth';

export class ResendVerificationGateway implements IResendVerificationGateway {
  private readonly httpClient: IHttpClient;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  async resendVerification(input: ResendVerificationGatewayInput): Promise<void> {
    const response = await this.httpClient.request<{ message: string }>({
      url: '/v1/resend-verification',
      method: 'post',
      body: input,
    });

    if (response.statusCode === 204) return;

    if (response.statusCode === 400) {
      const message = response.body?.message;
      if (message === 'Email already verified') throw new EmailAlreadyVerifiedError();
    }

    throw new UnexpectedError();
  }
}
