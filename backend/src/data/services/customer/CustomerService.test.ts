import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import {
  CustomerNotFoundError,
  EmailAlreadyRegisteredError,
  EmailAlreadyVerifiedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidVerificationCodeError,
  VerificationCodeExpiredError,
} from '../../../domain/errors/customer.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockCustomerRepository } from '../../../test/mocks/MockCustomerRepository.js';
import { mockEmailService } from '../../../test/mocks/MockEmailService.js';
import { mockHasher } from '../../../test/mocks/MockHasher.js';
import { mockJwtService } from '../../../test/mocks/MockJwtService.js';
import { mockTokenRepository } from '../../../test/mocks/MockTokenRepository.js';
import { CustomerService } from './CustomerService.js';

describe('CustomerService', () => {
  const makeSut = () => {
    const sut = new CustomerService(
      mockCustomerRepository,
      mockHasher,
      mockTokenRepository,
      mockEmailService,
      mockJwtService,
    );

    return { sut };
  };

  const customer = {
    id: 'customer-id',
    email: 'test@test.com',
    name: null,
    language: 'en',
    avatarUrl: null,
    verifiedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  };
  const verifiedCustomer = { ...customer, verifiedAt: '2024-01-01T01:00:00.000Z' };

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockCustomerRepository);
    resetMock(mockHasher);
    resetMock(mockTokenRepository);
    resetMock(mockEmailService);
    resetMock(mockJwtService);
  });

  describe('signup()', () => {
    it('should call findByEmail with correct email', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => null);
      mock.method(mockHasher, 'hash', async () => 'hashed-password');
      mock.method(mockCustomerRepository, 'insert', async () => customer);
      mock.method(mockTokenRepository, 'insert', async () => undefined);
      mock.method(mockEmailService, 'send', async () => undefined);

      await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.equal(mockCustomerRepository.findByEmail.mock.calls[0]?.arguments[0], 'test@test.com');
      assert.equal(mockCustomerRepository.findByEmail.mock.callCount(), 1);
    });

    it('should throw EmailAlreadyRegisteredError if email is already registered', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => customer);

      await assert.rejects(
        async () => sut.signup({ email: 'test@test.com', password: 'password123' }),
        new EmailAlreadyRegisteredError(),
      );
    });

    it('should call mockHasher.hash with the provided password', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => null);
      mock.method(mockHasher, 'hash', async () => 'hashed-password');
      mock.method(mockCustomerRepository, 'insert', async () => customer);
      mock.method(mockTokenRepository, 'insert', async () => undefined);
      mock.method(mockEmailService, 'send', async () => undefined);

      await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.equal(mockHasher.hash.mock.calls[0]?.arguments[0], 'password123');
    });

    it('should send a verification email after signup', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => null);
      mock.method(mockHasher, 'hash', async () => 'hashed-password');
      mock.method(mockCustomerRepository, 'insert', async () => customer);
      mock.method(mockTokenRepository, 'insert', async () => undefined);
      mock.method(mockEmailService, 'send', async () => undefined);

      await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.equal(mockEmailService.send.mock.callCount(), 1);
      assert.equal(mockEmailService.send.mock.calls[0]?.arguments[0], 'test@test.com');
    });

    it('should return the created customer', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => null);
      mock.method(mockHasher, 'hash', async () => 'hashed-password');
      mock.method(mockCustomerRepository, 'insert', async () => customer);
      mock.method(mockTokenRepository, 'insert', async () => undefined);
      mock.method(mockEmailService, 'send', async () => undefined);

      const result = await sut.signup({ email: 'test@test.com', password: 'password123' });

      assert.deepEqual(result, customer);
    });
  });

  describe('verifyEmail()', () => {
    const token = { id: 'token-id', expiresAt: new Date(Date.now() + 60_000) };

    it('should throw CustomerNotFoundError if customer does not exist', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => null);

      await assert.rejects(
        async () => sut.verifyEmail({ email: 'test@test.com', code: '123456' }),
        new CustomerNotFoundError(),
      );
    });

    it('should throw EmailAlreadyVerifiedError if customer is already verified', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => verifiedCustomer);

      await assert.rejects(
        async () => sut.verifyEmail({ email: 'test@test.com', code: '123456' }),
        new EmailAlreadyVerifiedError(),
      );
    });

    it('should throw InvalidVerificationCodeError if token is not found', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => customer);
      mock.method(mockTokenRepository, 'find', async () => null);

      await assert.rejects(
        async () => sut.verifyEmail({ email: 'test@test.com', code: '000000' }),
        new InvalidVerificationCodeError(),
      );
    });

    it('should throw VerificationCodeExpiredError if token is expired', async () => {
      const { sut } = makeSut();
      const expiredToken = { id: 'token-id', expiresAt: new Date(Date.now() - 60_000) };
      mock.method(mockCustomerRepository, 'findByEmail', async () => customer);
      mock.method(mockTokenRepository, 'find', async () => expiredToken);
      mock.method(mockTokenRepository, 'delete', async () => undefined);

      await assert.rejects(
        async () => sut.verifyEmail({ email: 'test@test.com', code: '123456' }),
        new VerificationCodeExpiredError(),
      );
    });

    it('should mark customer as verified and return updated customer', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => customer);
      mock.method(mockTokenRepository, 'find', async () => token);
      mock.method(mockTokenRepository, 'delete', async () => undefined);
      mock.method(mockCustomerRepository, 'markVerified', async () => verifiedCustomer);

      const result = await sut.verifyEmail({ email: 'test@test.com', code: '123456' });

      assert.deepEqual(result, verifiedCustomer);
      assert.equal(mockTokenRepository.delete.mock.callCount(), 1);
    });
  });

  describe('login()', () => {
    it('should throw InvalidCredentialsError if customer does not exist', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmailWithPassword', async () => null);

      await assert.rejects(
        async () => sut.login({ email: 'test@test.com', password: 'password123' }),
        new InvalidCredentialsError(),
      );
    });

    it('should throw InvalidCredentialsError if password does not match', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmailWithPassword', async () => ({
        ...verifiedCustomer,
        passwordHash: 'hashed-password',
      }));
      mock.method(mockHasher, 'compare', async () => false);

      await assert.rejects(
        async () => sut.login({ email: 'test@test.com', password: 'wrong-password' }),
        new InvalidCredentialsError(),
      );
    });

    it('should throw EmailNotVerifiedError if customer is not verified', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmailWithPassword', async () => ({
        ...customer,
        passwordHash: 'hashed-password',
      }));
      mock.method(mockHasher, 'compare', async () => true);

      await assert.rejects(
        async () => sut.login({ email: 'test@test.com', password: 'password123' }),
        new EmailNotVerifiedError(),
      );
    });

    it('should call mockJwtService.sign with correct payload', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmailWithPassword', async () => ({
        ...verifiedCustomer,
        passwordHash: 'hashed-password',
      }));
      mock.method(mockHasher, 'compare', async () => true);
      mock.method(mockJwtService, 'sign', async () => 'test-token');

      await sut.login({ email: 'test@test.com', password: 'password123' });

      assert.deepEqual(mockJwtService.sign.mock.calls[0]?.arguments[0], {
        sub: 'customer-id',
        email: 'test@test.com',
      });
    });

    it('should return an access token on success', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmailWithPassword', async () => ({
        ...verifiedCustomer,
        passwordHash: 'hashed-password',
      }));
      mock.method(mockHasher, 'compare', async () => true);
      mock.method(mockJwtService, 'sign', async () => 'test-token');

      const result = await sut.login({ email: 'test@test.com', password: 'password123' });

      assert.deepEqual(result, { accessToken: 'test-token' });
    });
  });

  describe('resendVerification()', () => {
    it('should throw CustomerNotFoundError if customer does not exist', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => null);

      await assert.rejects(
        async () => sut.resendVerification({ email: 'test@test.com' }),
        new CustomerNotFoundError(),
      );
    });

    it('should throw EmailAlreadyVerifiedError if customer is already verified', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => verifiedCustomer);

      await assert.rejects(
        async () => sut.resendVerification({ email: 'test@test.com' }),
        new EmailAlreadyVerifiedError(),
      );
    });

    it('should delete old tokens and send a new verification email', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => customer);
      mock.method(mockTokenRepository, 'deleteByCustomerAndType', async () => undefined);
      mock.method(mockTokenRepository, 'insert', async () => undefined);
      mock.method(mockEmailService, 'send', async () => undefined);

      await sut.resendVerification({ email: 'test@test.com' });

      assert.equal(mockTokenRepository.deleteByCustomerAndType.mock.callCount(), 1);
      assert.equal(mockTokenRepository.insert.mock.callCount(), 1);
      assert.equal(mockEmailService.send.mock.callCount(), 1);
    });
  });

  describe('requestPasswordReset()', () => {
    it('should return silently if customer does not exist', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => null);

      await assert.doesNotReject(async () =>
        sut.requestPasswordReset({ email: 'nonexistent@test.com' }),
      );

      assert.equal(mockEmailService.send.mock.callCount(), 0);
    });

    it('should delete old tokens and send a reset email', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => customer);
      mock.method(mockTokenRepository, 'deleteByCustomerAndType', async () => undefined);
      mock.method(mockTokenRepository, 'insert', async () => undefined);
      mock.method(mockEmailService, 'send', async () => undefined);

      await sut.requestPasswordReset({ email: 'test@test.com' });

      assert.equal(mockTokenRepository.deleteByCustomerAndType.mock.callCount(), 1);
      assert.equal(mockTokenRepository.insert.mock.callCount(), 1);
      assert.equal(mockEmailService.send.mock.callCount(), 1);
      assert.equal(mockEmailService.send.mock.calls[0]?.arguments[1], 'Reset your password');
    });
  });

  describe('resetPassword()', () => {
    const validToken = { id: 'token-id', expiresAt: new Date(Date.now() + 60_000) };

    it('should throw CustomerNotFoundError if customer does not exist', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => null);

      await assert.rejects(
        async () =>
          sut.resetPassword({ email: 'test@test.com', code: '123456', newPassword: 'newpass123' }),
        new CustomerNotFoundError(),
      );
    });

    it('should throw InvalidVerificationCodeError if token is not found', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => customer);
      mock.method(mockTokenRepository, 'find', async () => null);

      await assert.rejects(
        async () =>
          sut.resetPassword({ email: 'test@test.com', code: '000000', newPassword: 'newpass123' }),
        new InvalidVerificationCodeError(),
      );
    });

    it('should throw VerificationCodeExpiredError if token is expired', async () => {
      const { sut } = makeSut();
      const expiredToken = { id: 'token-id', expiresAt: new Date(Date.now() - 60_000) };
      mock.method(mockCustomerRepository, 'findByEmail', async () => customer);
      mock.method(mockTokenRepository, 'find', async () => expiredToken);
      mock.method(mockTokenRepository, 'delete', async () => undefined);

      await assert.rejects(
        async () =>
          sut.resetPassword({ email: 'test@test.com', code: '123456', newPassword: 'newpass123' }),
        new VerificationCodeExpiredError(),
      );
    });

    it('should hash new password and update customer', async () => {
      const { sut } = makeSut();
      mock.method(mockCustomerRepository, 'findByEmail', async () => customer);
      mock.method(mockTokenRepository, 'find', async () => validToken);
      mock.method(mockHasher, 'hash', async () => 'new-hashed-password');
      mock.method(mockCustomerRepository, 'updatePassword', async () => undefined);
      mock.method(mockTokenRepository, 'delete', async () => undefined);

      await sut.resetPassword({
        email: 'test@test.com',
        code: '123456',
        newPassword: 'newpass123',
      });

      assert.equal(mockHasher.hash.mock.calls[0]?.arguments[0], 'newpass123');
      assert.equal(mockCustomerRepository.updatePassword.mock.callCount(), 1);
      assert.equal(mockTokenRepository.delete.mock.callCount(), 1);
    });
  });
});
