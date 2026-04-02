import { accountOverviewService, accountService } from '../factories/account.js';
import { jwtService } from '../factories/auth.js';
import { makeAccountHandler } from './account-routes.js';

export const handler = makeAccountHandler(accountService, accountOverviewService, jwtService);
