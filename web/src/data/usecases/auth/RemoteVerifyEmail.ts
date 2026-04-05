import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IVerifyEmailGateway } from '@/data/protocols/auth/IVerifyEmailGateway';
import type { VerifyEmailInput } from '@/domain/models/auth/Auth';
import type { IVerifyEmail } from '@/domain/usecases/auth/IVerifyEmail';

export class RemoteVerifyEmail implements IVerifyEmail {
  private readonly gateway: IVerifyEmailGateway;

  constructor(gateway: IVerifyEmailGateway) {
    this.gateway = gateway;
  }

  async execute(input: VerifyEmailInput): Promise<void> {
    try {
      await this.gateway.verifyEmail(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
