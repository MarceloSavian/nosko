import { Pool } from 'pg';
import { AccountOverviewService } from '../../data/services/account/AccountOverviewService.js';
import { AccountService } from '../../data/services/account/AccountService.js';
import { BankAccountOwnershipRepository } from '../../infra/repositories/account/BankAccountOwnershipRepository.js';
import { BankAccountRepository } from '../../infra/repositories/account/BankAccountRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bankAccountRepository = new BankAccountRepository(pool);
const ownershipRepository = new BankAccountOwnershipRepository(pool);

export const accountService = new AccountService(bankAccountRepository, ownershipRepository);
export const accountOverviewService = new AccountOverviewService(
  bankAccountRepository,
  ownershipRepository,
);
