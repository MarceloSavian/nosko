import type { InstitutionSchema } from '@/domain/models/institution/Institution';

export interface IListInstitutions {
  execute(): Promise<InstitutionSchema[]>;
}
