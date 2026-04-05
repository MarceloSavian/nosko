import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IInstitutionGateway } from '@/data/protocols/institution/IInstitutionGateway';
import type { Institution } from '@/domain/models/institution/Institution';
import type { ILoadInstitutions } from '@/domain/usecases/institution/ILoadInstitutions';

export class RemoteLoadInstitutions implements ILoadInstitutions {
  private readonly gateway: IInstitutionGateway;

  constructor(gateway: IInstitutionGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<Institution[]> {
    try {
      return await this.gateway.loadAll();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
