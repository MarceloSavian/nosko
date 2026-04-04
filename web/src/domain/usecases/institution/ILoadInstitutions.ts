import type { Institution } from '@/domain/models/institution/Institution';

export interface ILoadInstitutions {
  execute(): Promise<Institution[]>;
}
