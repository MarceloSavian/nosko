import { Pool } from 'pg';
import { CurrencyService } from '../../data/services/currency/CurrencyService.js';
import { ProfileService } from '../../data/services/profile/ProfileService.js';
import { CurrencyDefaultRepository } from '../../infra/repositories/currency/CurrencyDefaultRepository.js';
import { CustomerRepository } from '../../infra/repositories/customer/CustomerRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const customerRepository = new CustomerRepository(pool);
const currencyDefaultRepository = new CurrencyDefaultRepository(pool);

export const profileService = new ProfileService(customerRepository);
export const currencyService = new CurrencyService(currencyDefaultRepository);
