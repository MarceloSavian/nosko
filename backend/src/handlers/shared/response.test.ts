import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatResponse } from './response.js';

describe('formatResponse', () => {
  describe('formatResponse()', () => {
    it('should return the given status code', () => {
      const result = formatResponse(201, {});

      assert.equal(result.statusCode, 201);
    });

    it('should JSON-stringify the data as the body', () => {
      const data = { id: '1', email: 'test@test.com' };

      const result = formatResponse(200, data);

      assert.equal(result.body, JSON.stringify(data));
    });
  });
});
