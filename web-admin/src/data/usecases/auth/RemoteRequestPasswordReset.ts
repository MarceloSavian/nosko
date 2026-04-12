import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IPasswordResetGateway } from '@/data/protocols/auth/IPasswordResetGateway';
import type { RequestPasswordResetInput } from '@/domain/models/auth/Auth';
import type { IRequestPasswordReset } from '@/domain/usecases/auth/IRequestPasswordReset';

export class RemoteRequestPasswordReset implements IRequestPasswordReset {
  private readonly gateway: IPasswordResetGateway;

  constructor(gateway: IPasswordResetGateway) {
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
