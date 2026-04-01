import { mock } from 'node:test';
import type { IInstitutionRepository } from '../../data/domain/institution/IInstitutionRepository.js';
import type { InstitutionSchema } from '../../domain/models/institution/Institution.js';

class MockInstitutionRepository implements IInstitutionRepository {
  findAll = mock.fn(async (): Promise<InstitutionSchema[]> => []);
  findById = mock.fn(async (_id: string): Promise<InstitutionSchema | null> => null);
}

export const mockInstitutionRepository = new MockInstitutionRepository();
