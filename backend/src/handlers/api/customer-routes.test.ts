import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { ICustomerService } from '../../domain/usecases/customer/ICustomerService.js';
import { BaseError } from '../../shared/error.js';
import { makeCustomerHandler, makeLoginRoute, makeSignupRoute, makeVerifyEmailRoute, routeHandler } from './customer-routes.js';

describe('customer-routes', () => {
  const makeSut = () => {
    const customerService = {
      signup: mock.fn(),
      login: mock.fn(),
      verifyEmail: mock.fn(),
    } as unknown as ICustomerService & {
      signup: ReturnType<typeof mock.fn>;
      login: ReturnType<typeof mock.fn>;
      verifyEmail: ReturnType<typeof mock.fn>;
    };

    const signup = makeSignupRoute(customerService);
    const login = makeLoginRoute(customerService);
    const verifyEmail = makeVerifyEmailRoute(customerService);
    const routes = { 'POST /signup': signup };

    return { signup, login, verifyEmail, routes, customerService };
  };

  beforeEach(() => {
    mock.restoreAll();
  });

  const makeEvent = (overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 =>
    ({
      routeKey: 'POST /signup',
      body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      ...overrides,
    }) as unknown as APIGatewayProxyEventV2;

  const customer = { id: 'id-1', email: 'test@test.com', verifiedAt: null, createdAt: '2024-01-01T00:00:00.000Z' };
  const verifiedCustomer = { ...customer, verifiedAt: '2024-01-01T01:00:00.000Z' };

  describe('routeHandler()', () => {
    it('should return 404 for an unknown route', async () => {
      const { routes } = makeSut();

      const result = await routeHandler(routes, makeEvent({ routeKey: 'GET /unknown' }));

      assert.equal(result.statusCode, 404);
    });

    it('should dispatch to the matched route', async () => {
      const { routes, customerService } = makeSut();
      customerService.signup.mock.mockImplementationOnce(() => Promise.resolve(customer));

      const result = await routeHandler(routes, makeEvent());

      assert.equal(result.statusCode, 201);
    });
  });

  describe('makeSignupRoute()', () => {
    it('should return 201 with customer data on success', async () => {
      const { signup, customerService } = makeSut();
      customerService.signup.mock.mockImplementationOnce(() => Promise.resolve(customer));

      const result = await signup(makeEvent());

      assert.equal(result.statusCode, 201);
      assert.deepEqual(JSON.parse(result.body), customer);
    });

    it('should return 400 for invalid input', async () => {
      const { signup } = makeSut();

      const result = await signup(makeEvent({ body: JSON.stringify({ email: 'not-an-email', password: 'pass' }) }));

      assert.equal(result.statusCode, 400);
    });

    it('should return 400 when the service throws a BaseError', async () => {
      const { signup, customerService } = makeSut();
      customerService.signup.mock.mockImplementationOnce(() => {
        throw new BaseError('Email already registered', 400);
      });

      const result = await signup(makeEvent());

      assert.equal(result.statusCode, 400);
      assert.deepEqual(JSON.parse(result.body), { message: 'Email already registered' });
    });

    it('should return 500 when the service throws an unexpected error', async () => {
      const { signup, customerService } = makeSut();
      customerService.signup.mock.mockImplementationOnce(() => {
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
      const { login, customerService } = makeSut();
      customerService.login.mock.mockImplementationOnce(() => Promise.resolve({ accessToken: 'test-token' }));

      const result = await login(makeEvent({
        routeKey: 'POST /login',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      }));

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), { accessToken: 'test-token' });
    });

    it('should return 401 when service throws InvalidCredentialsError', async () => {
      const { login, customerService } = makeSut();
      customerService.login.mock.mockImplementationOnce(() => {
        throw new BaseError('Invalid credentials', 401);
      });

      const result = await login(makeEvent({
        routeKey: 'POST /login',
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
      }));

      assert.equal(result.statusCode, 401);
    });

    it('should return 400 for invalid input', async () => {
      const { login } = makeSut();

      const result = await login(makeEvent({
        routeKey: 'POST /login',
        body: JSON.stringify({ email: 'not-an-email' }),
      }));

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeVerifyEmailRoute()', () => {
    it('should return 200 with verified customer on success', async () => {
      const { verifyEmail, customerService } = makeSut();
      customerService.verifyEmail.mock.mockImplementationOnce(() => Promise.resolve(verifiedCustomer));

      const result = await verifyEmail(makeEvent({
        routeKey: 'POST /verify-email',
        body: JSON.stringify({ email: 'test@test.com', code: '123456' }),
      }));

      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), verifiedCustomer);
    });

    it('should return 400 for invalid input', async () => {
      const { verifyEmail } = makeSut();

      const result = await verifyEmail(makeEvent({
        routeKey: 'POST /verify-email',
        body: JSON.stringify({ email: 'test@test.com', code: '12' }),
      }));

      assert.equal(result.statusCode, 400);
    });

    it('should return 400 when service throws a BaseError', async () => {
      const { verifyEmail, customerService } = makeSut();
      customerService.verifyEmail.mock.mockImplementationOnce(() => {
        throw new BaseError('Invalid verification code', 400);
      });

      const result = await verifyEmail(makeEvent({
        routeKey: 'POST /verify-email',
        body: JSON.stringify({ email: 'test@test.com', code: '000000' }),
      }));

      assert.equal(result.statusCode, 400);
    });
  });

  describe('makeCustomerHandler()', () => {
    it('should route POST /signup correctly', async () => {
      const { customerService } = makeSut();
      customerService.signup.mock.mockImplementationOnce(() => Promise.resolve(customer));

      const handler = makeCustomerHandler(customerService);
      const result = await handler(makeEvent({ routeKey: 'POST /signup' }));

      assert.equal(result.statusCode, 201);
    });

    it('should route POST /login correctly', async () => {
      const { customerService } = makeSut();
      customerService.login.mock.mockImplementationOnce(() => Promise.resolve({ accessToken: 'test-token' }));

      const handler = makeCustomerHandler(customerService);
      const result = await handler(makeEvent({
        routeKey: 'POST /login',
        body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
      }));

      assert.equal(result.statusCode, 200);
    });

    it('should route POST /verify-email correctly', async () => {
      const { customerService } = makeSut();
      customerService.verifyEmail.mock.mockImplementationOnce(() => Promise.resolve(verifiedCustomer));

      const handler = makeCustomerHandler(customerService);
      const result = await handler(makeEvent({
        routeKey: 'POST /verify-email',
        body: JSON.stringify({ email: 'test@test.com', code: '123456' }),
      }));

      assert.equal(result.statusCode, 200);
    });

    it('should return 404 for unknown routes', async () => {
      const { customerService } = makeSut();

      const handler = makeCustomerHandler(customerService);
      const result = await handler(makeEvent({ routeKey: 'DELETE /unknown' }));

      assert.equal(result.statusCode, 404);
    });
  });
});
