import { Pool } from 'pg';
import { InstitutionService } from '../../data/services/institution/InstitutionService.js';
import { InstitutionRepository } from '../../infra/repositories/institution/InstitutionRepository.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const institutionRepository = new InstitutionRepository(pool);

export const institutionService = new InstitutionService(institutionRepository);
