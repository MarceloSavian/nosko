import type { IResendVerificationGateway } from '@/data/protocols/auth/IResendVerificationGateway';
import { EmailAlreadyVerifiedError, UnexpectedError } from '@/domain/errors/auth';
import type { ResendVerificationInput } from '@/domain/models/auth/Auth';
import type { IResendVerification } from '@/domain/usecases/auth/IResendVerification';

export class RemoteResendVerification implements IResendVerification {
  private readonly gateway: IResendVerificationGateway;

  constructor(gateway: IResendVerificationGateway) {
    this.gateway = gateway;
  }

  async execute(input: ResendVerificationInput): Promise<void> {
    try {
      await this.gateway.resendVerification(input);
    } catch (error) {
      if (error instanceof EmailAlreadyVerifiedError) throw error;
      throw new UnexpectedError();
    }
  }
}
