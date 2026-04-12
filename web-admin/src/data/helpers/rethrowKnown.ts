import { UnexpectedError } from '@/domain/errors/auth';
import { domainErrors } from '@/domain/errors/domainErrors';

export function rethrowKnown(error: unknown): never {
  if (error instanceof Error && error.constructor.name in domainErrors) {
    throw error;
  }
  throw new UnexpectedError();
}
