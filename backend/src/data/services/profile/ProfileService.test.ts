import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { CustomerNotFoundError } from '../../../domain/errors/customer.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockCustomerRepository } from '../../../test/mocks/MockCustomerRepository.js';
import { ProfileService } from './ProfileService.js';

describe('ProfileService', () => {
  const makeSut = () => {
    const sut = new ProfileService(mockCustomerRepository);
    return { sut };
  };

  const customer = {
    id: 'customer-id',
    email: 'test@test.com',
    verifiedAt: '2024-01-01T01:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    resetMock(mockCustomerRepository);
  });

  describe('getProfile()', () => {
    it('should return the customer when found', async () => {
      const { sut } = makeSut();
      mockCustomerRepository.findById.mock.mockImplementationOnce(async () => customer);

      const result = await sut.getProfile('customer-id');

      assert.deepEqual(result, customer);
      assert.equal(mockCustomerRepository.findById.mock.calls[0]?.arguments[0], 'customer-id');
    });

    it('should throw CustomerNotFoundError when customer does not exist', async () => {
      const { sut } = makeSut();
      mockCustomerRepository.findById.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => sut.getProfile('nonexistent-id'),
        new CustomerNotFoundError(),
      );
    });
  });
});
