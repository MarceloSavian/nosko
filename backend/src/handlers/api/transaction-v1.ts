import { jwtService } from '../factories/auth.js';
import { transactionService } from '../factories/transaction.js';
import { makeTransactionHandler } from './transaction-routes.js';

export const handler = makeTransactionHandler(transactionService, jwtService);
