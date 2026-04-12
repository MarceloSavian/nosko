import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IAdminGateway } from '@/data/protocols/admin/IAdminGateway';
import type { AdminSchema, CreateAdminInput } from '@/domain/models/admin/Admin';
import type { ICreateAdmin } from '@/domain/usecases/admin/ICreateAdmin';

export class RemoteCreateAdmin implements ICreateAdmin {
  private readonly gateway: IAdminGateway;

  constructor(gateway: IAdminGateway) {
    this.gateway = gateway;
  }

  async execute(input: CreateAdminInput): Promise<AdminSchema> {
    try {
      return await this.gateway.create(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
