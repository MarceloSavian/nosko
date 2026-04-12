import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { IInstitutionGateway } from '@/data/protocols/institution/IInstitutionGateway';
import type {
  CreateInstitutionInput,
  InstitutionSchema,
} from '@/domain/models/institution/Institution';
import type { ICreateInstitution } from '@/domain/usecases/institution/ICreateInstitution';

export class RemoteCreateInstitution implements ICreateInstitution {
  private readonly gateway: IInstitutionGateway;

  constructor(gateway: IInstitutionGateway) {
    this.gateway = gateway;
  }

  async execute(input: CreateInstitutionInput): Promise<InstitutionSchema> {
    try {
      return await this.gateway.create(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
