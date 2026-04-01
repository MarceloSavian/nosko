import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Hasher } from './Hasher.js';

describe('Hasher', () => {
  const makeSut = () => {
    const sut = new Hasher(10);
    return { sut };
  };

  describe('hash()', () => {
    it('should return a hashed string different from the input', async () => {
      const { sut } = makeSut();

      const result = await sut.hash('plain-text');

      assert.notEqual(result, 'plain-text');
      assert.equal(typeof result, 'string');
    });

    it('should produce different hashes for the same input', async () => {
      const { sut } = makeSut();

      const hash1 = await sut.hash('plain-text');
      const hash2 = await sut.hash('plain-text');

      assert.notEqual(hash1, hash2);
    });
  });

  describe('compare()', () => {
    it('should return true when value matches the hash', async () => {
      const { sut } = makeSut();
      const hash = await sut.hash('plain-text');

      const result = await sut.compare('plain-text', hash);

      assert.equal(result, true);
    });

    it('should return false when value does not match the hash', async () => {
      const { sut } = makeSut();
      const hash = await sut.hash('plain-text');

      const result = await sut.compare('wrong-value', hash);

      assert.equal(result, false);
    });
  });
});
