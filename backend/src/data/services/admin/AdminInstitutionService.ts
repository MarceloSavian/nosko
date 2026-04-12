import type {
  CreateInstitutionInput,
  InstitutionSchema,
  UpdateInstitutionInput,
} from '../../../domain/models/institution/Institution.js';
import type { IAdminInstitutionService } from '../../../domain/usecases/admin/IAdminInstitutionService.js';
import { BaseError } from '../../../shared/error.js';
import type { IInstitutionRepository } from '../../domain/institution/IInstitutionRepository.js';

class InstitutionNotFoundError extends BaseError {
  constructor() {
    super('Institution not found', 404);
  }
}

export class AdminInstitutionService implements IAdminInstitutionService {
  constructor(private readonly institutionRepository: IInstitutionRepository) {}

  async listInstitutions(): Promise<InstitutionSchema[]> {
    return await this.institutionRepository.findAll();
  }

  async createInstitution(input: CreateInstitutionInput): Promise<InstitutionSchema> {
    return await this.institutionRepository.insert(input);
  }

  async updateInstitution(id: string, input: UpdateInstitutionInput): Promise<InstitutionSchema> {
    const institution = await this.institutionRepository.findById(id);
    if (!institution) throw new InstitutionNotFoundError();
    return await this.institutionRepository.update(id, input);
  }

  async deleteInstitution(id: string): Promise<void> {
    const institution = await this.institutionRepository.findById(id);
    if (!institution) throw new InstitutionNotFoundError();
    await this.institutionRepository.deleteById(id);
  }
}
