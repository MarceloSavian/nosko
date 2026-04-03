import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { accountRouteMetas } from '../handlers/api/account-routes.meta.js';
import { budgetRouteMetas } from '../handlers/api/budget-routes.meta.js';
import { customerRouteMetas } from '../handlers/api/customer-routes.meta.js';
import { dashboardRouteMetas } from '../handlers/api/dashboard-routes.meta.js';
import { institutionRouteMetas } from '../handlers/api/institution-routes.meta.js';
import { partnershipRouteMetas } from '../handlers/api/partnership-routes.meta.js';
import { profileRouteMetas } from '../handlers/api/profile-routes.meta.js';
import { transactionRouteMetas } from '../handlers/api/transaction-routes.meta.js';
import { generateDocument, registry } from './registry.js';
import { registerRouteMetas } from './route-descriptor.js';

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

registerRouteMetas([
  ...customerRouteMetas,
  ...accountRouteMetas,
  ...profileRouteMetas,
  ...institutionRouteMetas,
  ...partnershipRouteMetas,
  ...transactionRouteMetas,
  ...budgetRouteMetas,
  ...dashboardRouteMetas,
]);

const doc = generateDocument();
const outPath = join(import.meta.dirname, '..', '..', 'openapi.json');
writeFileSync(outPath, JSON.stringify(doc, null, 2));
console.log(`OpenAPI spec written to ${outPath}`);
