import type { ISignUpGateway, SignUpGatewayInput } from '@/data/protocols/auth/ISignUpGateway';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { EmailAlreadyRegisteredError, UnexpectedError } from '@/domain/errors/auth';
import type { SignupResult } from '@/domain/models/auth/Auth';

export class SignUpGateway implements ISignUpGateway {
  private readonly httpClient: IHttpClient;

  constructor(httpClient: IHttpClient) {
    this.httpClient = httpClient;
  }

  async signUp(input: SignUpGatewayInput): Promise<SignupResult> {
    const response = await this.httpClient.request<SignupResult | { message: string }>({
      url: '/v1/signup',
      method: 'post',
      body: input,
    });

    if (response.statusCode === 201) return response.body as SignupResult;

    if (response.statusCode === 400) {
      const body = response.body as { message: string };
      if (body.message === 'Email already registered') throw new EmailAlreadyRegisteredError();
    }

    throw new UnexpectedError();
  }
}
