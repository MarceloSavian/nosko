import { Pool } from 'pg';
import { CustomerService } from '../../data/services/customer/CustomerService.js';
import { Hasher } from '../../infra/cryptography/Hasher.js';
import { CustomerRepository } from '../../infra/repositories/customer/CustomerRepository.js';
import { TokenRepository } from '../../infra/repositories/customer/TokenRepository.js';
import { EmailService } from '../../infra/services/email/EmailService.js';
import { jwtService } from './auth.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const hasher = new Hasher(10);
const customerRepository = new CustomerRepository(pool);
const tokenRepository = new TokenRepository(pool);
if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is required');
if (!process.env.EMAIL_FROM) throw new Error('EMAIL_FROM is required');

const emailService = new EmailService(process.env.RESEND_API_KEY, process.env.EMAIL_FROM);

export const customerService = new CustomerService(
  customerRepository,
  hasher,
  tokenRepository,
  emailService,
  jwtService,
);
