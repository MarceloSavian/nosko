import { cookieDomain } from '../factories/config.js';
import { customerService } from '../factories/customer.js';
import { makeCustomerHandler } from './customer-routes.js';

export const handler = makeCustomerHandler(customerService, cookieDomain);
