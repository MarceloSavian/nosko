import type {
  CreateInstitutionInput,
  InstitutionSchema,
  UpdateInstitutionInput,
} from '../../../domain/models/institution/Institution.js';

export interface IInstitutionRepository {
  findAll(): Promise<InstitutionSchema[]>;
  findById(id: string): Promise<InstitutionSchema | null>;
  insert(input: CreateInstitutionInput): Promise<InstitutionSchema>;
  update(id: string, input: UpdateInstitutionInput): Promise<InstitutionSchema>;
  deleteById(id: string): Promise<void>;
}
