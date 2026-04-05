import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { ISignUpGateway } from '@/data/protocols/auth/ISignUpGateway';
import type { SignupInput, SignupResult } from '@/domain/models/auth/Auth';
import type { ISignUp } from '@/domain/usecases/auth/ISignUp';

export class RemoteSignUp implements ISignUp {
  private readonly gateway: ISignUpGateway;

  constructor(gateway: ISignUpGateway) {
    this.gateway = gateway;
  }

  async execute(input: SignupInput): Promise<SignupResult> {
    try {
      return await this.gateway.signUp(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
