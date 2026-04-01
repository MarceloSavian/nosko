import { Pool } from 'pg';
import { AccountService } from '../../data/services/account/AccountService.js';
import { BankAccountRepository } from '../../infra/repositories/account/BankAccountRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const bankAccountRepository = new BankAccountRepository(pool);

export const accountService = new AccountService(bankAccountRepository);
