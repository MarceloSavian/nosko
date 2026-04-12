import type {
  CreateInstitutionInput,
  InstitutionSchema,
} from '@/domain/models/institution/Institution';

export interface ICreateInstitution {
  execute(input: CreateInstitutionInput): Promise<InstitutionSchema>;
}
