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
