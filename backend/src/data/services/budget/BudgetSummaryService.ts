import { BudgetItemDirection } from '../../../domain/models/budget/BudgetPlan.js';
import { ContributionType } from '../../../domain/models/partnership/Partnership.js';
import type {
  BudgetSummary,
  BudgetSummaryItem,
  IBudgetSummaryService,
} from '../../../domain/usecases/budget/IBudgetSummaryService.js';
import type { IBankAccountOwnershipRepository } from '../../domain/account/IBankAccountOwnershipRepository.js';
import type { IBudgetItemRepository } from '../../domain/budget/IBudgetItemRepository.js';
import type { IBudgetPlanRepository } from '../../domain/budget/IBudgetPlanRepository.js';
import type { IContributionRuleRepository } from '../../domain/partnership/IContributionRuleRepository.js';
import type { IPartnershipRepository } from '../../domain/partnership/IPartnershipRepository.js';
import type { ITransactionRepository } from '../../domain/transaction/ITransactionRepository.js';

export class BudgetSummaryService implements IBudgetSummaryService {
  constructor(
    private readonly planRepository: IBudgetPlanRepository,
    private readonly itemRepository: IBudgetItemRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly ownershipRepository: IBankAccountOwnershipRepository,
    private readonly partnershipRepository: IPartnershipRepository,
    private readonly contributionRuleRepository: IContributionRuleRepository,
  ) {}

  async getSummary(customerId: string, yearMonth: string): Promise<BudgetSummary> {
    const bankAccountIds = await this.ownershipRepository.findAccountIdsByCustomerId(customerId);

    const allTransactions =
      bankAccountIds.length > 0
        ? await this.transactionRepository.findByFilters(
            { bankAccountIds, yearMonth },
            { limit: 1000, offset: 0 },
          )
        : null;
    const transactions = allTransactions ? allTransactions.data : [];

    const personalPlan = await this.planRepository.findByCustomerAndMonth(customerId, yearMonth);
    const personalItems = personalPlan
      ? await this.itemRepository.findByPlanId(personalPlan.id)
      : [];

    const personalSummaryItems = personalItems.map((item) =>
      this.buildSummaryItem(item, transactions),
    );

    const personalIncome = personalSummaryItems
      .filter((i) => i.direction === BudgetItemDirection.INCOME)
      .reduce((sum, i) => sum + i.plannedAmount, 0);

    const personalExpenses = personalSummaryItems
      .filter((i) => i.direction === BudgetItemDirection.EXPENSE)
      .reduce((sum, i) => sum + i.plannedAmount, 0);

    const partnership = await this.partnershipRepository.findByCustomerId(customerId);
    let jointItems: BudgetSummaryItem[] = [];
    let jointExpenses = 0;
    let yourJointShare = 0;

    if (partnership) {
      const jointPlan = await this.planRepository.findByPartnershipAndMonth(
        partnership.id,
        yearMonth,
      );
      if (jointPlan) {
        const jointBudgetItems = await this.itemRepository.findByPlanId(jointPlan.id);
        jointItems = jointBudgetItems.map((item) => this.buildSummaryItem(item, transactions));

        jointExpenses = jointItems
          .filter((i) => i.direction === BudgetItemDirection.EXPENSE)
          .reduce((sum, i) => sum + i.plannedAmount, 0);

        yourJointShare = await this.calculateJointShare(
          customerId,
          partnership.id,
          partnership.customerAId,
          jointExpenses,
        );
      }
    }

    const freeAmount = personalIncome - personalExpenses - yourJointShare;

    return {
      yearMonth,
      personalIncome,
      personalExpenses,
      jointExpenses,
      yourJointShare,
      freeAmount,
      personalItems: personalSummaryItems,
      jointItems,
    };
  }

  private buildSummaryItem(
    item: {
      id: string;
      name: string;
      categoryId: string;
      direction: string;
      type: string;
      plannedAmount: number;
    },
    transactions: { budgetItemId: string | null; amount: number }[],
  ): BudgetSummaryItem {
    const actualAmount = transactions
      .filter((tx) => tx.budgetItemId === item.id)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    return {
      itemId: item.id,
      name: item.name,
      categoryId: item.categoryId,
      direction: item.direction,
      type: item.type,
      plannedAmount: item.plannedAmount,
      actualAmount,
    };
  }

  private async calculateJointShare(
    customerId: string,
    partnershipId: string,
    customerAId: string,
    totalJointExpenses: number,
  ): Promise<number> {
    const rule = await this.contributionRuleRepository.findByPartnershipId(partnershipId);

    if (!rule) return Math.round(totalJointExpenses / 2);

    const isCustomerA = customerId === customerAId;

    switch (rule.type) {
      case ContributionType.EQUAL:
        return Math.round(totalJointExpenses / 2);

      case ContributionType.CUSTOM_PERCENTAGE: {
        const percentage = isCustomerA ? rule.customerAPercentage : rule.customerBPercentage;
        if (percentage === null) return Math.round(totalJointExpenses / 2);
        return Math.round((totalJointExpenses * percentage) / 10000);
      }

      case ContributionType.SALARY_PROPORTIONAL:
        return Math.round(totalJointExpenses / 2);

      default:
        return Math.round(totalJointExpenses / 2);
    }
  }
}
