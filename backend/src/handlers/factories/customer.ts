import { Pool } from 'pg';
import { CustomerService } from '../../data/services/customer/CustomerService.js';
import { Hasher } from '../../infra/cryptography/Hasher.js';
import { CustomerRepository } from '../../infra/repositories/customer/CustomerRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const hasher = new Hasher(10);
const customerRepository = new CustomerRepository(pool);

export const customerService = new CustomerService(customerRepository, hasher);
