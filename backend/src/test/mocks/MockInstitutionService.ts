import { mock } from 'node:test';
import type { InstitutionSchema } from '../../domain/models/institution/Institution.js';
import type { IInstitutionService } from '../../domain/usecases/institution/IInstitutionService.js';

class MockInstitutionService implements IInstitutionService {
  listInstitutions = mock.fn(async (): Promise<InstitutionSchema[]> => []);
}

export const mockInstitutionService = new MockInstitutionService();
