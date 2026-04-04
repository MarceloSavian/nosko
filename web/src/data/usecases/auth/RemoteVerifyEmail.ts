import type { IVerifyEmailGateway } from '@/data/protocols/auth/IVerifyEmailGateway';
import {
  InvalidVerificationCodeError,
  UnexpectedError,
  VerificationCodeExpiredError,
} from '@/domain/errors/auth';
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
      if (error instanceof InvalidVerificationCodeError) throw error;
      if (error instanceof VerificationCodeExpiredError) throw error;
      throw new UnexpectedError();
    }
  }
}
