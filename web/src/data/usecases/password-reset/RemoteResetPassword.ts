import type { IResetPasswordGateway } from '@/data/protocols/password-reset/IResetPasswordGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { InvalidResetCodeError, ResetCodeExpiredError } from '@/domain/errors/password-reset';
import type { ResetPasswordInput } from '@/domain/models/password-reset/PasswordReset';
import type { IResetPassword } from '@/domain/usecases/password-reset/IResetPassword';

export class RemoteResetPassword implements IResetPassword {
  private readonly gateway: IResetPasswordGateway;

  constructor(gateway: IResetPasswordGateway) {
    this.gateway = gateway;
  }

  async execute(input: ResetPasswordInput): Promise<void> {
    try {
      await this.gateway.resetPassword(input);
    } catch (error) {
      if (error instanceof InvalidResetCodeError) throw error;
      if (error instanceof ResetCodeExpiredError) throw error;
      throw new UnexpectedError();
    }
  }
}
