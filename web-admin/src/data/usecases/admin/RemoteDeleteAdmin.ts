import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IAdminGateway } from '@/data/protocols/admin/IAdminGateway';
import type { IDeleteAdmin } from '@/domain/usecases/admin/IDeleteAdmin';

export class RemoteDeleteAdmin implements IDeleteAdmin {
  private readonly gateway: IAdminGateway;

  constructor(gateway: IAdminGateway) {
    this.gateway = gateway;
  }

  async execute(id: string): Promise<void> {
    try {
      await this.gateway.delete(id);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
