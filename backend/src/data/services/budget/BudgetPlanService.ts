import { BudgetItemNotFoundError, BudgetPlanNotFoundError } from '../../../domain/errors/budget.js';
import { PartnershipNotFoundError } from '../../../domain/errors/partnership.js';
import type {
  BudgetItemSchema,
  BudgetPlanSchema,
  CreateBudgetItemInput,
  CreateBudgetPlanInput,
  UpdateBudgetItemInput,
} from '../../../domain/models/budget/BudgetPlan.js';
import type { IBudgetPlanService } from '../../../domain/usecases/budget/IBudgetPlanService.js';
import type { IBudgetItemRepository } from '../../domain/budget/IBudgetItemRepository.js';
import type { IBudgetPlanRepository } from '../../domain/budget/IBudgetPlanRepository.js';
import type { IPartnershipRepository } from '../../domain/partnership/IPartnershipRepository.js';

export class BudgetPlanService implements IBudgetPlanService {
  constructor(
    private readonly planRepository: IBudgetPlanRepository,
    private readonly itemRepository: IBudgetItemRepository,
    private readonly partnershipRepository: IPartnershipRepository,
  ) {}

  async getPersonalPlan(
    customerId: string,
    yearMonth: string,
  ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] } | null> {
    const plan = await this.planRepository.findByCustomerAndMonth(customerId, yearMonth);
    if (!plan) return null;
    const items = await this.itemRepository.findByPlanId(plan.id);
    return { plan, items };
  }

  async createPersonalPlan(
    customerId: string,
    input: CreateBudgetPlanInput,
  ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] }> {
    const plan = await this.planRepository.insertPersonal(
      customerId,
      input.yearMonth,
      input.currencyCode,
    );

    const items = await this.carryForwardItems(customerId, input.yearMonth, plan.id, false);
    return { plan, items };
  }

  async deletePersonalPlan(customerId: string, planId: string): Promise<void> {
    const plan = await this.planRepository.findById(planId);
    if (!plan || plan.customerId !== customerId) throw new BudgetPlanNotFoundError();
    await this.planRepository.delete(planId);
  }

  async getJointPlan(
    customerId: string,
    yearMonth: string,
  ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] } | null> {
    const partnership = await this.partnershipRepository.findByCustomerId(customerId);
    if (!partnership) throw new PartnershipNotFoundError();
    const plan = await this.planRepository.findByPartnershipAndMonth(partnership.id, yearMonth);
    if (!plan) return null;
    const items = await this.itemRepository.findByPlanId(plan.id);
    return { plan, items };
  }

  async createJointPlan(
    customerId: string,
    input: CreateBudgetPlanInput,
  ): Promise<{ plan: BudgetPlanSchema; items: BudgetItemSchema[] }> {
    const partnership = await this.partnershipRepository.findByCustomerId(customerId);
    if (!partnership) throw new PartnershipNotFoundError();

    const plan = await this.planRepository.insertJoint(
      partnership.id,
      input.yearMonth,
      input.currencyCode,
    );

    const items = await this.carryForwardItemsJoint(partnership.id, input.yearMonth, plan.id);
    return { plan, items };
  }

  async deleteJointPlan(customerId: string, planId: string): Promise<void> {
    const plan = await this.planRepository.findById(planId);
    if (!plan || !plan.partnershipId) throw new BudgetPlanNotFoundError();

    const partnership = await this.partnershipRepository.findByCustomerId(customerId);
    if (!partnership || partnership.id !== plan.partnershipId) throw new BudgetPlanNotFoundError();

    await this.planRepository.delete(planId);
  }

  async addItem(planId: string, input: CreateBudgetItemInput): Promise<BudgetItemSchema> {
    const plan = await this.planRepository.findById(planId);
    if (!plan) throw new BudgetPlanNotFoundError();

    const installmentNumber = input.recurrence === 'INSTALLMENT' ? 1 : undefined;
    return await this.itemRepository.insert(planId, input, installmentNumber);
  }

  async updateItem(
    planId: string,
    itemId: string,
    input: UpdateBudgetItemInput,
  ): Promise<BudgetItemSchema> {
    const item = await this.itemRepository.findById(itemId);
    if (!item || item.planId !== planId) throw new BudgetItemNotFoundError();
    return await this.itemRepository.update(itemId, input);
  }

  async deleteItem(planId: string, itemId: string): Promise<void> {
    const item = await this.itemRepository.findById(itemId);
    if (!item || item.planId !== planId) throw new BudgetItemNotFoundError();
    await this.itemRepository.delete(itemId);
  }

  private getPreviousMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split('-').map(Number);
    if (month === 1) return `${year - 1}-12`;
    return `${year}-${String(month - 1).padStart(2, '0')}`;
  }

  private async carryForwardItems(
    customerId: string,
    yearMonth: string,
    newPlanId: string,
    _isJoint: boolean,
  ): Promise<BudgetItemSchema[]> {
    const prevMonth = this.getPreviousMonth(yearMonth);
    const prevPlan = await this.planRepository.findByCustomerAndMonth(customerId, prevMonth);
    if (!prevPlan) return [];

    return await this.copyRecurringItems(prevPlan.id, newPlanId);
  }

  private async carryForwardItemsJoint(
    partnershipId: string,
    yearMonth: string,
    newPlanId: string,
  ): Promise<BudgetItemSchema[]> {
    const prevMonth = this.getPreviousMonth(yearMonth);
    const prevPlan = await this.planRepository.findByPartnershipAndMonth(partnershipId, prevMonth);
    if (!prevPlan) return [];

    return await this.copyRecurringItems(prevPlan.id, newPlanId);
  }

  private async copyRecurringItems(
    sourcePlanId: string,
    targetPlanId: string,
  ): Promise<BudgetItemSchema[]> {
    const prevItems = await this.itemRepository.findByPlanId(sourcePlanId);
    const copiedItems: BudgetItemSchema[] = [];

    for (const item of prevItems) {
      if (item.recurrence === 'ONE_TIME') continue;

      if (item.recurrence === 'INSTALLMENT') {
        const total = item.installmentTotal ?? 0;
        const current = item.installmentNumber ?? 0;
        if (current >= total) continue;

        const copied = await this.itemRepository.insert(
          targetPlanId,
          {
            categoryId: item.categoryId,
            name: item.name,
            plannedAmount: Number(item.plannedAmount),
            type: item.type as 'FIXED' | 'ESTIMATED',
            recurrence: 'INSTALLMENT',
            installmentTotal: total,
          },
          current + 1,
          item.id,
        );
        copiedItems.push(copied);
        continue;
      }

      // PERMANENT
      const copied = await this.itemRepository.insert(
        targetPlanId,
        {
          categoryId: item.categoryId,
          name: item.name,
          plannedAmount: Number(item.plannedAmount),
          type: item.type as 'FIXED' | 'ESTIMATED',
          recurrence: 'PERMANENT',
        },
        undefined,
        item.id,
      );
      copiedItems.push(copied);
    }

    return copiedItems;
  }
}
