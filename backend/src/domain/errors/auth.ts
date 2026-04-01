import { BaseError } from '../../shared/error.js';

export class MissingTokenError extends BaseError {
  constructor() {
    super('Missing authorization token', 401);
  }
}

export class InvalidTokenError extends BaseError {
  constructor() {
    super('Invalid or expired token', 401);
  }
}
