import { jwtService } from '../factories/auth.js';
import { dashboardService } from '../factories/dashboard.js';
import { makeDashboardHandler } from './dashboard-routes.js';

export const handler = makeDashboardHandler(dashboardService, jwtService);
