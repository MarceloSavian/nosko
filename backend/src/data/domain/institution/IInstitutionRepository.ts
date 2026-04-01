import type { InstitutionSchema } from '../../../domain/models/institution/Institution.js';

export interface IInstitutionRepository {
  findAll(): Promise<InstitutionSchema[]>;
  findById(id: string): Promise<InstitutionSchema | null>;
}
