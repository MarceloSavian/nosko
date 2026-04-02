import { Pool } from 'pg';
import { TransactionService } from '../../data/services/transaction/TransactionService.js';
import { BankAccountOwnershipRepository } from '../../infra/repositories/account/BankAccountOwnershipRepository.js';
import { BankAccountRepository } from '../../infra/repositories/account/BankAccountRepository.js';
import { TransactionRepository } from '../../infra/repositories/transaction/TransactionRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const transactionRepository = new TransactionRepository(pool);
const bankAccountRepository = new BankAccountRepository(pool);
const ownershipRepository = new BankAccountOwnershipRepository(pool);

export const transactionService = new TransactionService(
  transactionRepository,
  bankAccountRepository,
  ownershipRepository,
);
