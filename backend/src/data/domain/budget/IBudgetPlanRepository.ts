import type { BudgetPlanSchema } from '../../../domain/models/budget/BudgetPlan.js';

export interface IBudgetPlanRepository {
  findByCustomerAndMonth(customerId: string, yearMonth: string): Promise<BudgetPlanSchema | null>;
  findByPartnershipAndMonth(
    partnershipId: string,
    yearMonth: string,
  ): Promise<BudgetPlanSchema | null>;
  findById(id: string): Promise<BudgetPlanSchema | null>;
  insertPersonal(
    customerId: string,
    yearMonth: string,
    currencyCode: string,
  ): Promise<BudgetPlanSchema>;
  insertJoint(
    partnershipId: string,
    yearMonth: string,
    currencyCode: string,
  ): Promise<BudgetPlanSchema>;
  delete(id: string): Promise<void>;
}
