export class AccountNotFoundError extends Error {
  constructor() {
    super('Account not found');
    this.name = 'AccountNotFoundError';
  }
}

export class UnexpectedError extends Error {
  constructor() {
    super('Something went wrong. Please try again.');
    this.name = 'UnexpectedError';
  }
}
