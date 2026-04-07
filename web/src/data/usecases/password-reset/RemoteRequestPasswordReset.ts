import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IRequestPasswordResetGateway } from '@/data/protocols/password-reset/IRequestPasswordResetGateway';
import type { RequestPasswordResetInput } from '@/domain/models/password-reset/PasswordReset';
import type { IRequestPasswordReset } from '@/domain/usecases/password-reset/IRequestPasswordReset';

export class RemoteRequestPasswordReset implements IRequestPasswordReset {
  private readonly gateway: IRequestPasswordResetGateway;

  constructor(gateway: IRequestPasswordResetGateway) {
    this.gateway = gateway;
  }

  async execute(input: RequestPasswordResetInput): Promise<void> {
    try {
      await this.gateway.requestReset(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
