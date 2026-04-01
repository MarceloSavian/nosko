import { BaseError } from '../../shared/error.js';

export class EmailAlreadyRegisteredError extends BaseError {
  constructor() {
    super('Email already registered', 400);
  }
}

export class CustomerNotFoundError extends BaseError {
  constructor() {
    super('Customer not found', 404);
  }
}

export class EmailAlreadyVerifiedError extends BaseError {
  constructor() {
    super('Email already verified', 400);
  }
}

export class InvalidVerificationCodeError extends BaseError {
  constructor() {
    super('Invalid verification code', 400);
  }
}

export class VerificationCodeExpiredError extends BaseError {
  constructor() {
    super('Verification code expired', 400);
  }
}

export class InvalidCredentialsError extends BaseError {
  constructor() {
    super('Invalid credentials', 401);
  }
}

export class EmailNotVerifiedError extends BaseError {
  constructor() {
    super('Email not verified', 403);
  }
}
