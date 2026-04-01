import { jwtService } from '../factories/auth.js';
import { institutionService } from '../factories/institution.js';
import { makeInstitutionHandler } from './institution-routes.js';

export const handler = makeInstitutionHandler(institutionService, jwtService);
