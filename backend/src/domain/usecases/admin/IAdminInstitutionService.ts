import type {
  CreateInstitutionInput,
  InstitutionSchema,
  UpdateInstitutionInput,
} from '../../models/institution/Institution.js';

export interface IAdminInstitutionService {
  listInstitutions(): Promise<InstitutionSchema[]>;
  createInstitution(input: CreateInstitutionInput): Promise<InstitutionSchema>;
  updateInstitution(id: string, input: UpdateInstitutionInput): Promise<InstitutionSchema>;
  deleteInstitution(id: string): Promise<void>;
}
