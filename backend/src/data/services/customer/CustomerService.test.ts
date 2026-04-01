import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { ICustomerRepository } from '../../domain/customer/ICustomerRepository.js';
import type { IHasher } from '../../domain/customer/IHasher.js';
import type { IVerificationTokenRepository } from '../../domain/customer/IVerificationTokenRepository.js';
import type { IEmailService } from '../../domain/email/IEmailService.js';
import type { IJwtService } from '../../domain/auth/IJwtService.js';
import { CustomerService } from './CustomerService.js';
import {
  EmailAlreadyRegisteredError,
  CustomerNotFoundError,
  EmailAlreadyVerifiedError,
  InvalidVerificationCodeError,
  VerificationCodeExpiredError,
  InvalidCredentialsError,
  EmailNotVerifiedError,
} from '../../../domain/errors/customer.js';

describe('CustomerService', () => {
  const makeSut = () => {
    const customerRepository = {
      findByEmail: mock.fn(),
      findByEmailWithPassword: mock.fn(),
      insert: mock.fn(),
      markVerified: mock.fn(),
    } as unknown as ICustomerRepository & {
      findByEmail: ReturnType<typeof mock.fn>;
      findByEmailWithPassword: ReturnType<typeof mock.fn>;
      insert: ReturnType<typeof mock.fn>;
      markVerified: ReturnType<typeof mock.fn>;
    };

    const hasher = {
      hash: mock.fn(),
      compare: mock.fn(),
    } as unknown as IHasher & {
      hash: ReturnType<typeof mock.fn>;
      compare: ReturnType<typeof mock.fn>;
    };

    const verificationTokenRepository = {
      insert: mock.fn(),
      find: mock.fn(),
      delete: mock.fn(),
    } as unknown as IVerificationTokenRepository & {
      insert: ReturnType<typeof mock.fn>;
      find: ReturnType<typeof mock.fn>;
      delete: ReturnType<typeof mock.fn>;
    };

    const emailService = {
      send: mock.fn(),
    } as unknown as IEmailService & {
      send: ReturnType<typeof mock.fn>;
    };

    const jwtService = {
      sign: mock.fn(),
      verify: mock.fn(),
    } as unknown as IJwtService & {
      sign: ReturnType<typeof mock.fn>;
      verify: ReturnType<typeof mock.fn>;
    };

    const sut = new CustomerService(customerRepository, hasher, verificationTokenRepository, emailService, jwtService);

    return { sut, customerRepository, hasher, verificationTokenRepository, emailService, jwtService };
  };

  const customer = { id: 'customer-id', email: 'test@test.com', verifiedAt: null, createdAt: '2024-01-01T00:00:00.000Z' };
  const verifiedCustomer = { ...customer, verifiedAt: '2024-01-01T01:00:00.000Z' };

  beforeEach(() => {
    mock.restoreAll();
  });

  describe('signup()', () => {
    it('should call findByEmail with correct email', async () => {
      const { sut, customerRepository, hasher, verificationTokenRepository, emailService } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => null);
      hasher.hash.mock.mockImplementationOnce(async () => 'hashed-password');
      customerRepository.insert.mock.mockImplementationOnce(async () => customer);
      verificationTokenRepository.insert.mock.mockImplementationOnce(async () => undefined);
      emailService.send.mock.mockImplementationOnce(async () => undefined);

      await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.equal(customerRepository.findByEmail.mock.calls[0]?.arguments[0], 'test@test.com');
      assert.equal(customerRepository.findByEmail.mock.callCount(), 1);
    });

    it('should throw EmailAlreadyRegisteredError if email is already registered', async () => {
      const { sut, customerRepository } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => customer);

      await assert.rejects(
        async () => sut.signup({ email: 'test@test.com', password: 'password123' }),
        new EmailAlreadyRegisteredError(),
      );
    });

    it('should call hasher.hash with the provided password', async () => {
      const { sut, customerRepository, hasher, verificationTokenRepository, emailService } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => null);
      hasher.hash.mock.mockImplementationOnce(async () => 'hashed-password');
      customerRepository.insert.mock.mockImplementationOnce(async () => customer);
      verificationTokenRepository.insert.mock.mockImplementationOnce(async () => undefined);
      emailService.send.mock.mockImplementationOnce(async () => undefined);

      await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.equal(hasher.hash.mock.calls[0]?.arguments[0], 'password123');
    });

    it('should send a verification email after signup', async () => {
      const { sut, customerRepository, hasher, verificationTokenRepository, emailService } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => null);
      hasher.hash.mock.mockImplementationOnce(async () => 'hashed-password');
      customerRepository.insert.mock.mockImplementationOnce(async () => customer);
      verificationTokenRepository.insert.mock.mockImplementationOnce(async () => undefined);
      emailService.send.mock.mockImplementationOnce(async () => undefined);

      await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.equal(emailService.send.mock.callCount(), 1);
      assert.equal(emailService.send.mock.calls[0]?.arguments[0], 'test@test.com');
    });

    it('should return the created customer', async () => {
      const { sut, customerRepository, hasher, verificationTokenRepository, emailService } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => null);
      hasher.hash.mock.mockImplementationOnce(async () => 'hashed-password');
      customerRepository.insert.mock.mockImplementationOnce(async () => customer);
      verificationTokenRepository.insert.mock.mockImplementationOnce(async () => undefined);
      emailService.send.mock.mockImplementationOnce(async () => undefined);

      const result = await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.deepEqual(result, customer);
    });
  });

  describe('verifyEmail()', () => {
    const token = { id: 'token-id', expiresAt: new Date(Date.now() + 60_000) };

    it('should throw CustomerNotFoundError if customer does not exist', async () => {
      const { sut, customerRepository } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => sut.verifyEmail({ email: 'test@test.com', code: '123456' }),
        new CustomerNotFoundError(),
      );
    });

    it('should throw EmailAlreadyVerifiedError if customer is already verified', async () => {
      const { sut, customerRepository } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => verifiedCustomer);

      await assert.rejects(
        async () => sut.verifyEmail({ email: 'test@test.com', code: '123456' }),
        new EmailAlreadyVerifiedError(),
      );
    });

    it('should throw InvalidVerificationCodeError if token is not found', async () => {
      const { sut, customerRepository, verificationTokenRepository } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => customer);
      verificationTokenRepository.find.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => sut.verifyEmail({ email: 'test@test.com', code: '000000' }),
        new InvalidVerificationCodeError(),
      );
    });

    it('should throw VerificationCodeExpiredError if token is expired', async () => {
      const { sut, customerRepository, verificationTokenRepository } = makeSut();
      const expiredToken = { id: 'token-id', expiresAt: new Date(Date.now() - 60_000) };
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => customer);
      verificationTokenRepository.find.mock.mockImplementationOnce(async () => expiredToken);
      verificationTokenRepository.delete.mock.mockImplementationOnce(async () => undefined);

      await assert.rejects(
        async () => sut.verifyEmail({ email: 'test@test.com', code: '123456' }),
        new VerificationCodeExpiredError(),
      );
    });

    it('should mark customer as verified and return updated customer', async () => {
      const { sut, customerRepository, verificationTokenRepository } = makeSut();
      customerRepository.findByEmail.mock.mockImplementationOnce(async () => customer);
      verificationTokenRepository.find.mock.mockImplementationOnce(async () => token);
      verificationTokenRepository.delete.mock.mockImplementationOnce(async () => undefined);
      customerRepository.markVerified.mock.mockImplementationOnce(async () => verifiedCustomer);

      const result = await sut.verifyEmail({ email: 'test@test.com', code: '123456' });

      assert.deepEqual(result, verifiedCustomer);
      assert.equal(verificationTokenRepository.delete.mock.callCount(), 1);
    });
  });

  describe('login()', () => {
    it('should throw InvalidCredentialsError if customer does not exist', async () => {
      const { sut, customerRepository } = makeSut();
      customerRepository.findByEmailWithPassword.mock.mockImplementationOnce(async () => null);

      await assert.rejects(
        async () => sut.login({ email: 'test@test.com', password: 'password123' }),
        new InvalidCredentialsError(),
      );
    });

    it('should throw InvalidCredentialsError if password does not match', async () => {
      const { sut, customerRepository, hasher } = makeSut();
      customerRepository.findByEmailWithPassword.mock.mockImplementationOnce(async () => ({
        ...verifiedCustomer,
        passwordHash: 'hashed-password',
      }));
      hasher.compare.mock.mockImplementationOnce(async () => false);

      await assert.rejects(
        async () => sut.login({ email: 'test@test.com', password: 'wrong-password' }),
        new InvalidCredentialsError(),
      );
    });

    it('should throw EmailNotVerifiedError if customer is not verified', async () => {
      const { sut, customerRepository, hasher } = makeSut();
      customerRepository.findByEmailWithPassword.mock.mockImplementationOnce(async () => ({
        ...customer,
        passwordHash: 'hashed-password',
      }));
      hasher.compare.mock.mockImplementationOnce(async () => true);

      await assert.rejects(
        async () => sut.login({ email: 'test@test.com', password: 'password123' }),
        new EmailNotVerifiedError(),
      );
    });

    it('should call jwtService.sign with correct payload', async () => {
      const { sut, customerRepository, hasher, jwtService } = makeSut();
      customerRepository.findByEmailWithPassword.mock.mockImplementationOnce(async () => ({
        ...verifiedCustomer,
        passwordHash: 'hashed-password',
      }));
      hasher.compare.mock.mockImplementationOnce(async () => true);
      jwtService.sign.mock.mockImplementationOnce(async () => 'test-token');

      await sut.login({ email: 'test@test.com', password: 'password123' });

      assert.deepEqual(jwtService.sign.mock.calls[0]?.arguments[0], {
        sub: 'customer-id',
        email: 'test@test.com',
      });
    });

    it('should return an access token on success', async () => {
      const { sut, customerRepository, hasher, jwtService } = makeSut();
      customerRepository.findByEmailWithPassword.mock.mockImplementationOnce(async () => ({
        ...verifiedCustomer,
        passwordHash: 'hashed-password',
      }));
      hasher.compare.mock.mockImplementationOnce(async () => true);
      jwtService.sign.mock.mockImplementationOnce(async () => 'test-token');

      const result = await sut.login({ email: 'test@test.com', password: 'password123' });

      assert.deepEqual(result, { accessToken: 'test-token' });
    });
  });
});
