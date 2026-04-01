import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { BaseError } from '../../shared/error.js';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockCustomerService } from '../../test/mocks/MockCustomerService.js';
import {
  makeCustomerHandler,
  makeLoginRoute,
  makeRequestPasswordResetRoute,
  makeResendVerificationRoute,
  makeResetPasswordRoute,
  makeSignupRoute,
  makeVerifyEmailRoute,
  routeHandler,
} from './customer-routes.js';

describe('customer-routes', () => {
  const makeSut = () => {
    const signup = makeSignupRoute(mockCustomerService);
    const login = makeLoginRoute(mockCustomerService);
    const verifyEmail = makeVerifyEmailRoute(mockCustomerService);
    const resendVerification = makeResendVerificationRoute(mockCustomerService);
    const requestPasswordReset = makeRequestPasswordResetRoute(mockCustomerService);
    const resetPassword = makeResetPasswordRoute(mockCustomerService);
    const routes = { 'POST /v1/signup': signup };

    return {
      signup,
      login,
      verifyEmail,
      resendVerification,
      requestPasswordReset,
      resetPassword,
      routes,
    };
  };

  beforeEach(() => {
    resetMock(mockCustomerService);
  });

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'POST /v1/signup',
      body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      ...overrides,
    }) as unknown as APIGatewayProxyEventV2;

  const customer = {
    id: 'id-1',
    email: 'test@test.com',
    name: null,
    language: 'en',
    avatarUrl: null,
    verifiedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
  };
  const verifiedCustomer = { ...customer, verifiedAt: '2024-01-01T01:00:00.000Z' };

  describe('routeHandler()', () => {
    it('should return 404 for an unknown route', async () => {
      const { routes } = makeSut();

      const result = await routeHandler(routes, makeEvent({ routeKey: 'GET /unknown' }));

      assert.equal(result.statusCode, 404);
    });

    it('should dispatch to the matched route', async () => {
      const { routes } = makeSut();
      mockCustomerService.signup.mock.mockImplementationOnce(() => Promise.resolve(customer));

      const result = await routeHandler(routes, makeEvent());

      assert.equal(result.statusCode, 201);
    });
  });

  describe('makeSignupRoute()', () => {
    it('should return 201 with customer data on success', async () => {
      const { signup } = makeSut();
      mockCustomerService.signup.mock.mockImplementationOnce(() => Promise.resolve(customer));

      const result = await signup(makeEvent());

      assert.equal(result.statusCode, 201);
      assert.deepEqual(JSON.parse(result.body), customer);
    });

    it('should return 400 for invalid input', async () => {
      const { signup } = makeSut();

      const result = await signup(
        makeEvent({ body: JSON.stringify({ email: 'not-an-email', password: 'pass' }) }),
      );

      assert.equal(result.statusCode, 400);
    });

    it('should return 400 when the service throws a BaseError', async () => {
      const { signup } = makeSut();
      mockCustomerService.signup.mock.mockImplementationOnce(() => {
        throw new BaseError('Email already registered', 400);
      });

      const result = await signup(makeEvent());

      assert.equal(result.statusCode, 400);
      assert.deepEqual(JSON.parse(result.body), { message: 'Email already registered' });
    });

    it('should return 500 when the service throws an unexpected error', async () => {
      const { signup } = makeSut();
      mockCustomerService.signup.mock.mockImplementationOnce(() => {
        throw new Error('database connection lost');
      });

      const result = await signup(makeEvent());

      assert.equal(result.statusCode, 500);
    });

    it('should handle a missing body as an empty object', async () => {
      const { signup } = makeSut();

      const result = await signup(makeEvent({ body: undefined }));

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeLoginRoute()', () => {
    it('should return 200 with access token on success', async () => {
      const { login } = makeSut();
      mockCustomerService.login.mock.mockImplementationOnce(() =>
        Promise.resolve({ accessToken: 'test-token' }),
      );

      const result = await login(
        makeEvent({
          routeKey: 'POST /v1/login',
          body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
        }),
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), { accessToken: 'test-token' });
    });

    it('should return 401 when service throws InvalidCredentialsError', async () => {
      const { login } = makeSut();
      mockCustomerService.login.mock.mockImplementationOnce(() => {
        throw new BaseError('Invalid credentials', 401);
      });

      const result = await login(
        makeEvent({
          routeKey: 'POST /v1/login',
          body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
        }),
      );

      assert.equal(result.statusCode, 401);
    });

    it('should return 400 for invalid input', async () => {
      const { login } = makeSut();

      const result = await login(
        makeEvent({
          routeKey: 'POST /v1/login',
          body: JSON.stringify({ email: 'not-an-email' }),
        }),
      );

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeVerifyEmailRoute()', () => {
    it('should return 200 with verified customer on success', async () => {
      const { verifyEmail } = makeSut();
      mockCustomerService.verifyEmail.mock.mockImplementationOnce(() =>
        Promise.resolve(verifiedCustomer),
      );

      const result = await verifyEmail(
        makeEvent({
          routeKey: 'POST /v1/verify-email',
          body: JSON.stringify({ email: 'test@test.com', code: '123456' }),
        }),
      );

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), verifiedCustomer);
    });

    it('should return 400 for invalid input', async () => {
      const { verifyEmail } = makeSut();

      const result = await verifyEmail(
        makeEvent({
          routeKey: 'POST /v1/verify-email',
          body: JSON.stringify({ email: 'test@test.com', code: '12' }),
        }),
      );

      assert.equal(result.statusCode, 400);
    });

    it('should return 400 when service throws a BaseError', async () => {
      const { verifyEmail } = makeSut();
      mockCustomerService.verifyEmail.mock.mockImplementationOnce(() => {
        throw new BaseError('Invalid verification code', 400);
      });

      const result = await verifyEmail(
        makeEvent({
          routeKey: 'POST /v1/verify-email',
          body: JSON.stringify({ email: 'test@test.com', code: '000000' }),
        }),
      );

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeResendVerificationRoute()', () => {
    it('should return 200 on success', async () => {
      const { resendVerification } = makeSut();

      const result = await resendVerification(
        makeEvent({
          routeKey: 'POST /v1/resend-verification',
          body: JSON.stringify({ email: 'test@test.com' }),
        }),
      );

      assert.equal(result.statusCode, 200);
    });

    it('should return 400 for invalid input', async () => {
      const { resendVerification } = makeSut();

      const result = await resendVerification(
        makeEvent({
          routeKey: 'POST /v1/resend-verification',
          body: JSON.stringify({ email: 'not-an-email' }),
        }),
      );

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeRequestPasswordResetRoute()', () => {
    it('should return 200 on success', async () => {
      const { requestPasswordReset } = makeSut();

      const result = await requestPasswordReset(
        makeEvent({
          routeKey: 'POST /v1/request-password-reset',
          body: JSON.stringify({ email: 'test@test.com' }),
        }),
      );

      assert.equal(result.statusCode, 200);
    });

    it('should return 400 for invalid input', async () => {
      const { requestPasswordReset } = makeSut();

      const result = await requestPasswordReset(
        makeEvent({
          routeKey: 'POST /v1/request-password-reset',
          body: JSON.stringify({ email: 'not-an-email' }),
        }),
      );

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeResetPasswordRoute()', () => {
    it('should return 200 on success', async () => {
      const { resetPassword } = makeSut();

      const result = await resetPassword(
        makeEvent({
          routeKey: 'POST /v1/reset-password',
          body: JSON.stringify({
            email: 'test@test.com',
            code: '123456',
            newPassword: 'newpass123',
          }),
        }),
      );

      assert.equal(result.statusCode, 200);
    });

    it('should return 400 for invalid input', async () => {
      const { resetPassword } = makeSut();

      const result = await resetPassword(
        makeEvent({
          routeKey: 'POST /v1/reset-password',
          body: JSON.stringify({ email: 'test@test.com', code: '12', newPassword: 'short' }),
        }),
      );

      assert.equal(result.statusCode, 400);
    });

    it('should return error when service throws', async () => {
      const { resetPassword } = makeSut();
      mockCustomerService.resetPassword.mock.mockImplementationOnce(() => {
        throw new BaseError('Customer not found', 404);
      });

      const result = await resetPassword(
        makeEvent({
          routeKey: 'POST /v1/reset-password',
          body: JSON.stringify({
            email: 'test@test.com',
            code: '123456',
            newPassword: 'newpass123',
          }),
        }),
      );

      assert.equal(result.statusCode, 404);
    });
  });

  describe('makeCustomerHandler()', () => {
    it('should route POST /signup correctly', async () => {
      mockCustomerService.signup.mock.mockImplementationOnce(() => Promise.resolve(customer));

      const handler = makeCustomerHandler(mockCustomerService);
      const result = await handler(makeEvent({ routeKey: 'POST /v1/signup' }));

      assert.equal(result.statusCode, 201);
    });

    it('should route POST /v1/login correctly', async () => {
      mockCustomerService.login.mock.mockImplementationOnce(() =>
        Promise.resolve({ accessToken: 'test-token' }),
      );

      const handler = makeCustomerHandler(mockCustomerService);
      const result = await handler(
        makeEvent({
          routeKey: 'POST /v1/login',
          body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
        }),
      );

      assert.equal(result.statusCode, 200);
    });

    it('should route POST /v1/verify-email correctly', async () => {
      mockCustomerService.verifyEmail.mock.mockImplementationOnce(() =>
        Promise.resolve(verifiedCustomer),
      );

      const handler = makeCustomerHandler(mockCustomerService);
      const result = await handler(
        makeEvent({
          routeKey: 'POST /v1/verify-email',
          body: JSON.stringify({ email: 'test@test.com', code: '123456' }),
        }),
      );

      assert.equal(result.statusCode, 200);
    });

    it('should return 404 for unknown routes', async () => {
      const handler = makeCustomerHandler(mockCustomerService);
      const result = await handler(makeEvent({ routeKey: 'DELETE /unknown' }));

      assert.equal(result.statusCode, 404);
    });
  });
});
