import { jwtService } from '../factories/auth.js';
import { partnershipService } from '../factories/partnership.js';
import { makePartnershipHandler } from './partnership-routes.js';

export const handler = makePartnershipHandler(partnershipService, jwtService);
