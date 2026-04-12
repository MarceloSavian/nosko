import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IInstitutionGateway } from '@/data/protocols/institution/IInstitutionGateway';
import type { IDeleteInstitution } from '@/domain/usecases/institution/IDeleteInstitution';

export class RemoteDeleteInstitution implements IDeleteInstitution {
  private readonly gateway: IInstitutionGateway;

  constructor(gateway: IInstitutionGateway) {
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
