import { BaseError } from '../../shared/error.js';

export class MissingApiKeyError extends BaseError {
  constructor() {
    super('Missing API key', 401);
  }
}

export class InvalidApiKeyError extends BaseError {
  constructor() {
    super('Invalid API key', 401);
  }
}

export class AdminNotFoundError extends BaseError {
  constructor() {
    super('Admin not found', 404);
  }
}

export class AdminEmailConflictError extends BaseError {
  constructor() {
    super('Email already registered', 409);
  }
}

export class AdminPasswordNotSetError extends BaseError {
  constructor() {
    super('Password not set. Use forgot password to set your password.', 403);
  }
}

export class AdminInvalidCredentialsError extends BaseError {
  constructor() {
    super('Invalid credentials', 401);
  }
}
