import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IResetPasswordGateway } from '@/data/protocols/password-reset/IResetPasswordGateway';
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
      rethrowKnown(error);
    }
  }
}
