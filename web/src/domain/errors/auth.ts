export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Email already registered');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class UnexpectedError extends Error {
  constructor() {
    super('Something went wrong. Please try again.');
    this.name = 'UnexpectedError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailNotVerifiedError extends Error {
  constructor() {
    super('Email not verified');
    this.name = 'EmailNotVerifiedError';
  }
}

export class InvalidVerificationCodeError extends Error {
  constructor() {
    super('Invalid verification code');
    this.name = 'InvalidVerificationCodeError';
  }
}

export class VerificationCodeExpiredError extends Error {
  constructor() {
    super('Verification code expired');
    this.name = 'VerificationCodeExpiredError';
  }
}
