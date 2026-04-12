export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class AdminPasswordNotSetError extends Error {
  constructor() {
    super('Password not set');
    this.name = 'AdminPasswordNotSetError';
  }
}

export class UnexpectedError extends Error {
  constructor() {
    super('Something went wrong. Please try again.');
    this.name = 'UnexpectedError';
  }
}

export class InvalidResetCodeError extends Error {
  constructor() {
    super('Invalid reset code');
    this.name = 'InvalidResetCodeError';
  }
}

export class ResetCodeExpiredError extends Error {
  constructor() {
    super('Reset code expired');
    this.name = 'ResetCodeExpiredError';
  }
}

export class AdminNotFoundError extends Error {
  constructor() {
    super('Admin not found');
    this.name = 'AdminNotFoundError';
  }
}

export class AdminEmailConflictError extends Error {
  constructor() {
    super('Email already registered');
    this.name = 'AdminEmailConflictError';
  }
}

export class CustomerNotFoundError extends Error {
  constructor() {
    super('Customer not found');
    this.name = 'CustomerNotFoundError';
  }
}

export class InstitutionNotFoundError extends Error {
  constructor() {
    super('Institution not found');
    this.name = 'InstitutionNotFoundError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor() {
    super('Category not found');
    this.name = 'CategoryNotFoundError';
  }
}
