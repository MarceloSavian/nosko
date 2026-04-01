import { Pool } from 'pg';
import { ProfileService } from '../../data/services/profile/ProfileService.js';
import { CustomerRepository } from '../../infra/repositories/customer/CustomerRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const customerRepository = new CustomerRepository(pool);

export const profileService = new ProfileService(customerRepository);
