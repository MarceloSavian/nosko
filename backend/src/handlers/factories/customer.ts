import { Pool } from 'pg';
import { CustomerService } from '../../data/services/customer/CustomerService.js';
import { Hasher } from '../../infra/cryptography/Hasher.js';
import { EmailService } from '../../infra/services/email/EmailService.js';
import { CustomerRepository } from '../../infra/repositories/customer/CustomerRepository.js';
import { VerificationTokenRepository } from '../../infra/repositories/customer/VerificationTokenRepository.js';
import { jwtService } from './auth.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const hasher = new Hasher(10);
const customerRepository = new CustomerRepository(pool);
const verificationTokenRepository = new VerificationTokenRepository(pool);
const emailService = new EmailService(process.env.RESEND_API_KEY!, process.env.EMAIL_FROM!);

export const customerService = new CustomerService(
  customerRepository,
  hasher,
  verificationTokenRepository,
  emailService,
  jwtService,
);
