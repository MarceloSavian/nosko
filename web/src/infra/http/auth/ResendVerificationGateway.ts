import type {
  IResendVerificationGateway,
  ResendVerificationGatewayInput,
} from '@/data/protocols/auth/IResendVerificationGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { UnexpectedError } from '@/domain/errors/auth';

export class ResendVerificationGateway implements IResendVerificationGateway {
  private readonly httpClient: IHttpClient;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  async resendVerification(input: ResendVerificationGatewayInput): Promise<void> {
    const response = await this.httpClient.request({
      url: '/v1/resend-verification',
      method: 'post',
      body: input,
    });

    if (response.statusCode === 204) return;

    throw new UnexpectedError();
  }
}
