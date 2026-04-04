import type { Institution } from '@/domain/models/institution/Institution';

export interface IInstitutionGateway {
  loadAll(): Promise<Institution[]>;
}
