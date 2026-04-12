import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IInstitutionGateway } from '@/data/protocols/institution/IInstitutionGateway';
import type {
  InstitutionSchema,
  UpdateInstitutionInput,
} from '@/domain/models/institution/Institution';
import type { IUpdateInstitution } from '@/domain/usecases/institution/IUpdateInstitution';

export class RemoteUpdateInstitution implements IUpdateInstitution {
  private readonly gateway: IInstitutionGateway;

  constructor(gateway: IInstitutionGateway) {
    this.gateway = gateway;
  }

  async execute(id: string, input: UpdateInstitutionInput): Promise<InstitutionSchema> {
    try {
      return await this.gateway.update(id, input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
