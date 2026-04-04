import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import { AccountNotFoundError, UnexpectedError } from '@/domain/errors/account';
import type { IDeleteAccount } from '@/domain/usecases/account/IDeleteAccount';

export class RemoteDeleteAccount implements IDeleteAccount {
  private readonly gateway: IAccountGateway;

  constructor(gateway: IAccountGateway) {
    this.gateway = gateway;
  }

  async execute(id: string): Promise<void> {
    try {
      await this.gateway.delete(id);
    } catch (error) {
      if (error instanceof AccountNotFoundError) throw error;
      throw new UnexpectedError();
    }
  }
}
