import { Pool } from 'pg';
import { PartnershipService } from '../../data/services/partnership/PartnershipService.js';
import { CustomerRepository } from '../../infra/repositories/customer/CustomerRepository.js';
import { ContributionRuleRepository } from '../../infra/repositories/partnership/ContributionRuleRepository.js';
import { PartnerInvitationRepository } from '../../infra/repositories/partnership/PartnerInvitationRepository.js';
import { PartnershipRepository } from '../../infra/repositories/partnership/PartnershipRepository.js';
import { SharedAccountRepository } from '../../infra/repositories/partnership/SharedAccountRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const customerRepository = new CustomerRepository(pool);
const invitationRepository = new PartnerInvitationRepository(pool);
const partnershipRepository = new PartnershipRepository(pool);
const contributionRuleRepository = new ContributionRuleRepository(pool);
const sharedAccountRepository = new SharedAccountRepository(pool);

export const partnershipService = new PartnershipService(
  customerRepository,
  invitationRepository,
  partnershipRepository,
  contributionRuleRepository,
  sharedAccountRepository,
);
