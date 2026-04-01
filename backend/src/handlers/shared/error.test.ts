import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ZodError } from 'zod';
import { BaseError } from '../../shared/error.js';
import { logErrorAndFormat } from './error.js';

describe('logErrorAndFormat', () => {
  describe('logErrorAndFormat()', () => {
    it('should return the BaseError statusCode and message', () => {
      const error = new BaseError('Email already registered', 400);

      const result = logErrorAndFormat(error);

      assert.equal(result.statusCode, 400);
      assert.deepEqual(JSON.parse(result.body), { message: 'Email already registered' });
    });

    it('should return 400 for a ZodError', () => {
      const error = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          input: undefined,
          path: ['email'],
          message: 'Required',
        },
      ]);

      const result = logErrorAndFormat(error);

      assert.equal(result.statusCode, 400);
    });

    it('should return 500 for a generic Error', () => {
      const error = new Error('something went wrong');

      const result = logErrorAndFormat(error);

      assert.equal(result.statusCode, 500);
      assert.deepEqual(JSON.parse(result.body), { message: 'Sorry we had a problem' });
    });

    it('should return 500 for an unknown non-Error value', () => {
      const result = logErrorAndFormat('unexpected string error');

      assert.equal(result.statusCode, 500);
      assert.deepEqual(JSON.parse(result.body), { message: 'Sorry we had a problem' });
    });
  });
});
