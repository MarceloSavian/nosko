import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JwtService } from './JwtService.js';

describe('JwtService', () => {
  const makeSut = () => {
    const sut = new JwtService('test-secret-that-is-long-enough');
    return { sut };
  };

  describe('sign()', () => {
    it('should return a JWT string', async () => {
      const { sut } = makeSut();

      const token = await sut.sign({ sub: 'customer-id', email: 'test@test.com' });

      assert.equal(typeof token, 'string');
      assert.equal(token.split('.').length, 3);
    });
  });

  describe('verify()', () => {
    it('should return the original payload from a valid token', async () => {
      const { sut } = makeSut();
      const token = await sut.sign({ sub: 'customer-id', email: 'test@test.com' });

      const payload = await sut.verify(token);

      assert.equal(payload.sub, 'customer-id');
      assert.equal(payload.email, 'test@test.com');
    });

    it('should throw for an invalid token', async () => {
      const { sut } = makeSut();

      await assert.rejects(async () => sut.verify('invalid-token'));
    });

    it('should throw for a token signed with a different secret', async () => {
      const other = new JwtService('different-secret-key-here');
      const token = await other.sign({ sub: 'customer-id', email: 'test@test.com' });

      const { sut } = makeSut();

      await assert.rejects(async () => sut.verify(token));
    });
  });
});
