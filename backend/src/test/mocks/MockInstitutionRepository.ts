import { mock } from 'node:test';
import type { IInstitutionRepository } from '../../data/domain/institution/IInstitutionRepository.js';
import type {
  CreateInstitutionInput,
  InstitutionSchema,
  UpdateInstitutionInput,
} from '../../domain/models/institution/Institution.js';

const defaultInstitution: InstitutionSchema = {
  id: '',
  name: '',
  countryCode: '',
  logoUrl: null,
};

class MockInstitutionRepository implements IInstitutionRepository {
  findAll = mock.fn(async (): Promise<InstitutionSchema[]> => []);
  findById = mock.fn(async (_id: string): Promise<InstitutionSchema | null> => null);
  insert = mock.fn(
    async (_input: CreateInstitutionInput): Promise<InstitutionSchema> => ({
      ...defaultInstitution,
    }),
  );
  update = mock.fn(
    async (_id: string, _input: UpdateInstitutionInput): Promise<InstitutionSchema> => ({
      ...defaultInstitution,
    }),
  );
  deleteById = mock.fn(async (_id: string): Promise<void> => {});
}

export const mockInstitutionRepository = new MockInstitutionRepository();
