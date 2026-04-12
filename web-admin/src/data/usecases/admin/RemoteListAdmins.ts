import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IAdminGateway } from '@/data/protocols/admin/IAdminGateway';
import type { AdminSchema } from '@/domain/models/admin/Admin';
import type { IListAdmins } from '@/domain/usecases/admin/IListAdmins';

export class RemoteListAdmins implements IListAdmins {
  private readonly gateway: IAdminGateway;

  constructor(gateway: IAdminGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<AdminSchema[]> {
    try {
      return await this.gateway.list();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
