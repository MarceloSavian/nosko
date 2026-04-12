import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { resetMock } from '../../test/helpers/resetMock.js';
import { mockJwtService } from '../../test/mocks/MockJwtService.js';
import type { AuthenticatedRoute } from '../domain/proxy.js';
import { withAuth } from './auth.js';

const mockHandler = mock.fn<AuthenticatedRoute>(
  async (): Promise<APIGatewayProxyResult> => ({ statusCode: 200, body: '' }),
);

describe('withAuth', () => {
  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockJwtService);
    mockHandler.mock.resetCalls();
  });

  const makeEvent = (cookies?: string[]): APIGatewayProxyEventV2 =>
    ({
      headers: {},
      cookies,
    }) as unknown as APIGatewayProxyEventV2;

  describe('withAuth()', () => {
    it('should return 401 when no cookies are present', async () => {
      const wrapped = withAuth(mockJwtService, mockHandler);

      const result = await wrapped(makeEvent());

      assert.equal(result.statusCode, 401);
      assert.deepEqual(JSON.parse(result.body), { message: 'Missing authorization token' });
    });

    it('should return 401 when session cookie is missing', async () => {
      const wrapped = withAuth(mockJwtService, mockHandler);

      const result = await wrapped(makeEvent(['other_cookie=abc']));

      assert.equal(result.statusCode, 401);
    });

    it('should return 401 when jwtService.verify throws', async () => {
      mock.method(mockJwtService, 'verify', async () => {
        throw new Error('invalid token');
      });
      const wrapped = withAuth(mockJwtService, mockHandler);

      const result = await wrapped(makeEvent(['nosko_session=invalid-token']));

      assert.equal(result.statusCode, 401);
      assert.deepEqual(JSON.parse(result.body), { message: 'Invalid or expired token' });
    });

    it('should call the handler with event and customerId on valid token', async () => {
      mock.method(mockJwtService, 'verify', async () => ({
        sub: 'customer-id',
        email: 'test@test.com',
      }));
      mockHandler.mock.mockImplementationOnce(async () => ({
        statusCode: 200,
        body: JSON.stringify({ ok: true }),
      }));
      const wrapped = withAuth(mockJwtService, mockHandler);
      const event = makeEvent(['nosko_session=valid-token']);

      await wrapped(event);

      assert.equal(mockHandler.mock.callCount(), 1);
      assert.equal(mockHandler.mock.calls[0]?.arguments[0], event);
      assert.equal(mockHandler.mock.calls[0]?.arguments[1], 'customer-id');
    });

    it('should return the handler response on success', async () => {
      mock.method(mockJwtService, 'verify', async () => ({
        sub: 'customer-id',
        email: 'test@test.com',
      }));
      const expected = { statusCode: 200, body: JSON.stringify({ ok: true }) };
      mockHandler.mock.mockImplementationOnce(async () => expected);
      const wrapped = withAuth(mockJwtService, mockHandler);

      const result = await wrapped(makeEvent(['nosko_session=valid-token']));

      assert.deepEqual(result, expected);
    });
  });
});
