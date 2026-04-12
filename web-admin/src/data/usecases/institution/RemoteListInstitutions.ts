import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IInstitutionGateway } from '@/data/protocols/institution/IInstitutionGateway';
import type { InstitutionSchema } from '@/domain/models/institution/Institution';
import type { IListInstitutions } from '@/domain/usecases/institution/IListInstitutions';

export class RemoteListInstitutions implements IListInstitutions {
  private readonly gateway: IInstitutionGateway;

  constructor(gateway: IInstitutionGateway) {
    this.gateway = gateway;
  }

  async execute(): Promise<InstitutionSchema[]> {
    try {
      return await this.gateway.list();
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
