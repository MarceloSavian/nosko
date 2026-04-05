import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { ILoginGateway } from '@/data/protocols/auth/ILoginGateway';
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
      rethrowKnown(error);
    }
  }
}
