import type { InstitutionSchema } from '../../../domain/models/institution/Institution.js';
import type { IInstitutionService } from '../../../domain/usecases/institution/IInstitutionService.js';
import type { IInstitutionRepository } from '../../domain/institution/IInstitutionRepository.js';

export class InstitutionService implements IInstitutionService {
  constructor(private readonly institutionRepository: IInstitutionRepository) {}

  async listInstitutions(): Promise<InstitutionSchema[]> {
    return await this.institutionRepository.findAll();
  }
}
