import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { ICustomerService } from '../../domain/usecases/customer/ICustomerService.js';
import { BaseError } from '../../shared/error.js';
import { makeCustomerHandler, makeSignupRoute, routeHandler } from './customer-routes.js';

describe('customer-routes', () => {
  const makeSut = () => {
    const customerService = {
      signup: mock.fn(),
    } as unknown as ICustomerService & { signup: ReturnType<typeof mock.fn> };

    const signup = makeSignupRoute(customerService);
    const routes = { 'POST /signup': signup };

    return { signup, routes, customerService };
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

  describe('routeHandler()', () => {
    it('should return 404 for an unknown route', async () => {
      const { routes } = makeSut();

      const result = await routeHandler(routes, makeEvent({ routeKey: 'GET /unknown' }));

      assert.equal(result.statusCode, 404);
    });

    it('should dispatch to the matched route', async () => {
      const { routes, customerService } = makeSut();
      const customer = { id: 'id-1', email: 'test@test.com', createdAt: '2024-01-01T00:00:00.000Z' };
      customerService.signup.mock.mockImplementationOnce(() => Promise.resolve(customer));

      const result = await routeHandler(routes, makeEvent());

      assert.equal(result.statusCode, 201);
    });
  });

  describe('makeSignupRoute()', () => {
    it('should return 201 with customer data on success', async () => {
      const { signup, customerService } = makeSut();
      const customer = { id: 'id-1', email: 'test@test.com', createdAt: '2024-01-01T00:00:00.000Z' };
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

  describe('makeCustomerHandler()', () => {
    it('should return a handler that routes POST /signup correctly', async () => {
      const customerService = {
        signup: mock.fn(),
      } as unknown as ICustomerService & { signup: ReturnType<typeof mock.fn> };
      const customer = { id: 'id-1', email: 'test@test.com', createdAt: '2024-01-01T00:00:00.000Z' };
      customerService.signup.mock.mockImplementationOnce(() => Promise.resolve(customer));

      const handler = makeCustomerHandler(customerService);
      const result = await handler(makeEvent());

      assert.equal(result.statusCode, 201);
    });

    it('should return a handler that returns 404 for unknown routes', async () => {
      const customerService = {
        signup: mock.fn(),
      } as unknown as ICustomerService;

      const handler = makeCustomerHandler(customerService);
      const result = await handler(makeEvent({ routeKey: 'DELETE /unknown' }));

      assert.equal(result.statusCode, 404);
    });
  });
});
