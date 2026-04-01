import { BaseError } from '../../shared/error.js';

export class TransactionNotFoundError extends BaseError {
  constructor() {
    super('Transaction not found', 404);
  }
}
