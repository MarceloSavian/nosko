import type { ILoginGateway } from '@/data/protocols/auth/ILoginGateway';
import {
  EmailNotVerifiedError,
  InvalidCredentialsError,
  UnexpectedError,
} from '@/domain/errors/auth';
import type { LoginInput, LoginResult } from '@/domain/models/auth/Auth';
import type { ILogin } from '@/domain/usecases/auth/ILogin';

export class RemoteLogin implements ILogin {
  private readonly gateway: ILoginGateway;

  constructor(gateway: ILoginGateway) {
    this.gateway = gateway;
  }

  async execute(input: LoginInput): Promise<LoginResult> {
    try {
      return await this.gateway.login(input);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) throw error;
      if (error instanceof EmailNotVerifiedError) throw error;
      throw new UnexpectedError();
    }
  }
}
