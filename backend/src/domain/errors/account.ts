import { BaseError } from '../../shared/error.js';

export class BankAccountNotFoundError extends BaseError {
  constructor() {
    super('Bank account not found', 404);
  }
}

export class BankAccountNotOwnedError extends BaseError {
  constructor() {
    super('Bank account does not belong to this customer', 403);
  }
}
