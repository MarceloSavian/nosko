import type { InstitutionSchema } from '../../models/institution/Institution.js';

export interface IInstitutionService {
  listInstitutions(): Promise<InstitutionSchema[]>;
}
