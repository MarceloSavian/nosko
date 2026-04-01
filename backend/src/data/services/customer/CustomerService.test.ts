import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { ICustomerRepository } from '../../domain/customer/ICustomerRepository.js';
import type { IHasher } from '../../domain/customer/IHasher.js';
import { CustomerService } from './CustomerService.js';
import { BaseError } from '../../../shared/error.js';

describe('CustomerService', () => {
  const makeSut = () => {
    const customerRepository = {
      findByEmail: mock.fn(),
      insert: mock.fn(),
    } as unknown as ICustomerRepository & {
      findByEmail: ReturnType<typeof mock.fn>;
      insert: ReturnType<typeof mock.fn>;
    };

    const hasher = {
      hash: mock.fn(),
      compare: mock.fn(),
    } as unknown as IHasher & {
      hash: ReturnType<typeof mock.fn>;
      compare: ReturnType<typeof mock.fn>;
    };

    const sut = new CustomerService(customerRepository, hasher);

    return { sut, customerRepository, hasher };
  };

  beforeEach(() => {
    mock.restoreAll();
  });

  describe('signup()', () => {
    it('should call findByEmail with correct email', async () => {
      const { sut, customerRepository } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => null);

      await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.equal(customerRepository.findByEmail.mock.calls[0]?.arguments[0], 'test@test.com');
      assert.equal(customerRepository.findByEmail.mock.callCount(), 1);
    });

    it('should throw error if email is already registered', async () => {
      const { sut, customerRepository } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => ({
        id: 'existing-id',
        email: 'test@test.com',
        createdAt: new Date().toISOString(),
      }));

      await assert.rejects(
        async () => sut.signup({ email: 'test@test.com', password: 'password123' }),
        new BaseError('Email already registered', 400),
      );
    });

    it('should call hasher.hash with the provided password', async () => {
      const { sut, customerRepository, hasher } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => null);
      hasher.hash.mock.mockImplementationOnce(async () => 'hashed-password');

      await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.equal(hasher.hash.mock.calls[0]?.arguments[0], 'password123');
      assert.equal(hasher.hash.mock.callCount(), 1);
    });

    it('should call repository.insert with email and hashed password', async () => {
      const { sut, customerRepository, hasher } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => null);
      hasher.hash.mock.mockImplementationOnce(async () => 'hashed-password');

      await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.deepEqual(customerRepository.insert.mock.calls[0]?.arguments[0], {
        email: 'test@test.com',
        passwordHash: 'hashed-password',
      });
      assert.equal(customerRepository.insert.mock.callCount(), 1);
    });

    it('should return the created customer', async () => {
      const { sut, customerRepository, hasher } = makeSut();
      const customer = { id: 'new-id', email: 'test@test.com', createdAt: '2024-01-01T00:00:00.000Z' };
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => null);
      hasher.hash.mock.mockImplementationOnce(async () => 'hashed-password');
      customerRepository.insert.mock.mockImplementationOnce(async () => customer);

      const result = await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.deepEqual(result, customer);
    });
  });
});
