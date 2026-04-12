import type {
  InstitutionSchema,
  UpdateInstitutionInput,
} from '@/domain/models/institution/Institution';

export interface IUpdateInstitution {
  execute(id: string, input: UpdateInstitutionInput): Promise<InstitutionSchema>;
}
