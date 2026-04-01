import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockInstitutionRepository } from '../../../test/mocks/MockInstitutionRepository.js';
import { InstitutionService } from './InstitutionService.js';

describe('InstitutionService', () => {
  const makeSut = () => {
    const sut = new InstitutionService(mockInstitutionRepository);
    return { sut };
  };

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockInstitutionRepository);
  });

  describe('listInstitutions()', () => {
    it('should return all institutions', async () => {
      const { sut } = makeSut();
      const institutions = [
        { id: '1', name: 'Chase', countryCode: 'US', logoUrl: null },
        { id: '2', name: 'Revolut', countryCode: 'GB', logoUrl: null },
      ];
      mock.method(mockInstitutionRepository, 'findAll', async () => institutions);

      const result = await sut.listInstitutions();

      assert.deepEqual(result, institutions);
    });
  });
});
