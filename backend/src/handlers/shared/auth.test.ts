import { beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { IJwtService } from '../../data/domain/auth/IJwtService.js';
import { withAuth } from './auth.js';

describe('withAuth', () => {
  const makeSut = () => {
    const jwtService = {
      sign: mock.fn(),
      verify: mock.fn(),
    } as unknown as IJwtService & {
      sign: ReturnType<typeof mock.fn>;
      verify: ReturnType<typeof mock.fn>;
    };

    const handler = mock.fn();

    return { jwtService, handler };
  };

  beforeEach(() => {
    mock.restoreAll();
  });

  const makeEvent = (authHeader?: string): APIGatewayProxyEventV2 =>
    ({
      headers: authHeader ? { authorization: authHeader } : {},
    }) as unknown as APIGatewayProxyEventV2;

  describe('withAuth()', () => {
    it('should return 401 when no Authorization header is present', async () => {
      const { jwtService, handler } = makeSut();
      const wrapped = withAuth(jwtService, handler);

      const result = await wrapped(makeEvent());

      assert.equal(result.statusCode, 401);
      assert.deepEqual(JSON.parse(result.body), { message: 'Missing authorization token' });
    });

    it('should return 401 when Authorization header does not start with Bearer', async () => {
      const { jwtService, handler } = makeSut();
      const wrapped = withAuth(jwtService, handler);

      const result = await wrapped(makeEvent('Basic abc'));

      assert.equal(result.statusCode, 401);
    });

    it('should return 401 when jwtService.verify throws', async () => {
      const { jwtService, handler } = makeSut();
      jwtService.verify.mock.mockImplementationOnce(async () => {
        throw new Error('invalid token');
      });
      const wrapped = withAuth(jwtService, handler);

      const result = await wrapped(makeEvent('Bearer invalid-token'));

      assert.equal(result.statusCode, 401);
      assert.deepEqual(JSON.parse(result.body), { message: 'Invalid or expired token' });
    });

    it('should call the handler with event and customerId on valid token', async () => {
      const { jwtService, handler } = makeSut();
      jwtService.verify.mock.mockImplementationOnce(async () => ({
        sub: 'customer-id',
        email: 'test@test.com',
      }));
      handler.mock.mockImplementationOnce(async () => ({
        statusCode: 200,
        body: JSON.stringify({ ok: true }),
      }));
      const wrapped = withAuth(jwtService, handler);
      const event = makeEvent('Bearer valid-token');

      await wrapped(event);

      assert.equal(handler.mock.callCount(), 1);
      assert.equal(handler.mock.calls[0]?.arguments[0], event);
      assert.equal(handler.mock.calls[0]?.arguments[1], 'customer-id');
    });

    it('should return the handler response on success', async () => {
      const { jwtService, handler } = makeSut();
      jwtService.verify.mock.mockImplementationOnce(async () => ({
        sub: 'customer-id',
        email: 'test@test.com',
      }));
      const expected = { statusCode: 200, body: JSON.stringify({ ok: true }) };
      handler.mock.mockImplementationOnce(async () => expected);
      const wrapped = withAuth(jwtService, handler);

      const result = await wrapped(makeEvent('Bearer valid-token'));

      assert.deepEqual(result, expected);
    });
  });
});
