import type {
  CreateInstitutionInput,
  InstitutionSchema,
  UpdateInstitutionInput,
} from '@/domain/models/institution/Institution';

export interface IInstitutionGateway {
  list(): Promise<InstitutionSchema[]>;
  create(input: CreateInstitutionInput): Promise<InstitutionSchema>;
  update(id: string, input: UpdateInstitutionInput): Promise<InstitutionSchema>;
  delete(id: string): Promise<void>;
}
