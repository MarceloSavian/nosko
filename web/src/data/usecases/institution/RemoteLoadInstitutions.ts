import type { IInstitutionGateway } from '@/data/protocols/institution/IInstitutionGateway';
import { UnexpectedError } from '@/domain/errors/account';
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
    } catch {
      throw new UnexpectedError();
    }
  }
}
