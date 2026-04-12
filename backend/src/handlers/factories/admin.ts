import { Pool } from 'pg';
import { AdminAuthService } from '../../data/services/admin/AdminAuthService.js';
import { AdminBudgetCategoryService } from '../../data/services/admin/AdminBudgetCategoryService.js';
import { AdminCustomerService } from '../../data/services/admin/AdminCustomerService.js';
import { AdminInstitutionService } from '../../data/services/admin/AdminInstitutionService.js';
import { AdminManagementService } from '../../data/services/admin/AdminManagementService.js';
import { Hasher } from '../../infra/cryptography/Hasher.js';
import { JwtService } from '../../infra/cryptography/JwtService.js';
import { AdminRepository } from '../../infra/repositories/admin/AdminRepository.js';
import { AdminTokenRepository } from '../../infra/repositories/admin/AdminTokenRepository.js';
import { BudgetCategoryRepository } from '../../infra/repositories/budget/BudgetCategoryRepository.js';
import { CustomerRepository } from '../../infra/repositories/customer/CustomerRepository.js';
import { InstitutionRepository } from '../../infra/repositories/institution/InstitutionRepository.js';
import { EmailService } from '../../infra/services/email/EmailService.js';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (!process.env.ADMIN_API_KEY) throw new Error('ADMIN_API_KEY is required');
if (!process.env.ADMIN_JWT_SECRET) throw new Error('ADMIN_JWT_SECRET is required');
if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is required');
if (!process.env.EMAIL_FROM) throw new Error('EMAIL_FROM is required');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const hasher = new Hasher(10);
const jwtService = new JwtService(process.env.ADMIN_JWT_SECRET);
const emailService = new EmailService(process.env.RESEND_API_KEY, process.env.EMAIL_FROM);

const adminRepository = new AdminRepository(pool);
const adminTokenRepository = new AdminTokenRepository(pool);
const customerRepository = new CustomerRepository(pool);
const institutionRepository = new InstitutionRepository(pool);
const budgetCategoryRepository = new BudgetCategoryRepository(pool);

export const apiKey = process.env.ADMIN_API_KEY;
export const adminJwtService = jwtService;

export const adminAuthService = new AdminAuthService(
  adminRepository,
  hasher,
  adminTokenRepository,
  emailService,
  jwtService,
);

export const adminManagementService = new AdminManagementService(adminRepository, hasher);
export const adminCustomerService = new AdminCustomerService(customerRepository);
export const adminInstitutionService = new AdminInstitutionService(institutionRepository);
export const adminBudgetCategoryService = new AdminBudgetCategoryService(budgetCategoryRepository);
