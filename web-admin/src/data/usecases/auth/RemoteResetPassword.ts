import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IPasswordResetGateway } from '@/data/protocols/auth/IPasswordResetGateway';
import type { ResetPasswordInput } from '@/domain/models/auth/Auth';
import type { IResetPassword } from '@/domain/usecases/auth/IResetPassword';

export class RemoteResetPassword implements IResetPassword {
  private readonly gateway: IPasswordResetGateway;

  constructor(gateway: IPasswordResetGateway) {
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
