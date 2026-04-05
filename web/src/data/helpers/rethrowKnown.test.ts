import { describe, expect, it } from 'vitest';
import {
  EmailAlreadyRegisteredError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  UnexpectedError,
} from '@/domain/errors/auth';
import { rethrowKnown } from './rethrowKnown';

describe('rethrowKnown', () => {
  it('should rethrow a known domain error', () => {
    const error = new InvalidCredentialsError();
    expect(() => rethrowKnown(error)).toThrow(error);
  });

  it('should rethrow different known domain errors', () => {
    const error = new EmailNotVerifiedError();
    expect(() => rethrowKnown(error)).toThrow(error);
  });

  it('should rethrow EmailAlreadyRegisteredError', () => {
    const error = new EmailAlreadyRegisteredError();
    expect(() => rethrowKnown(error)).toThrow(error);
  });

  it('should throw UnexpectedError for unknown errors', () => {
    const error = new Error('unknown');
    expect(() => rethrowKnown(error)).toThrow(UnexpectedError);
  });

  it('should throw UnexpectedError for non-Error values', () => {
    expect(() => rethrowKnown('string error')).toThrow(UnexpectedError);
  });

  it('should throw UnexpectedError for null', () => {
    expect(() => rethrowKnown(null)).toThrow(UnexpectedError);
  });
});
