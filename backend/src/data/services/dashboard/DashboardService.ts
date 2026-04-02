import type {
  DashboardData,
  IDashboardService,
} from '../../../domain/usecases/dashboard/IDashboardService.js';
import type { IBankAccountRepository } from '../../domain/account/IBankAccountRepository.js';
import type { IBudgetCategoryRepository } from '../../domain/budget/IBudgetCategoryRepository.js';
import type { IBudgetItemRepository } from '../../domain/budget/IBudgetItemRepository.js';
import type { IBudgetPlanRepository } from '../../domain/budget/IBudgetPlanRepository.js';
import type { ITransactionRepository } from '../../domain/transaction/ITransactionRepository.js';

const RECENT_TRANSACTION_LIMIT = 10;

export class DashboardService implements IDashboardService {
  constructor(
    private readonly bankAccountRepository: IBankAccountRepository,
    private readonly planRepository: IBudgetPlanRepository,
    private readonly itemRepository: IBudgetItemRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: IBudgetCategoryRepository,
  ) {}

  async getDashboard(customerId: string, yearMonth: string): Promise<DashboardData> {
    const accounts = await this.bankAccountRepository.findByCustomerId(customerId);
    const bankAccountIds = accounts.map((a) => a.id);

    // Get transactions for the month
    const allTransactions =
      bankAccountIds.length > 0
        ? await this.transactionRepository.findByFilters(
            { bankAccountIds, yearMonth },
            { limit: 1000, offset: 0 },
          )
        : null;
    const transactions = allTransactions ? allTransactions.data : [];

    const totalSpending = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Get budget plan for the month
    const plan = await this.planRepository.findByCustomerAndMonth(customerId, yearMonth);
    let budgetSummary: DashboardData['budgetSummary'] = [];

    if (plan) {
      const items = await this.itemRepository.findByPlanId(plan.id);
      const categories = await this.categoryRepository.findAll();
      const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

      budgetSummary = items.map((item) => {
        const actual = transactions
          .filter((tx) => tx.budgetItemId === item.id)
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        return {
          categoryName: categoryMap.get(item.categoryId) ?? 'Unknown',
          planned: item.plannedAmount,
          actual,
        };
      });
    }

    const recentTransactions = transactions.slice(0, RECENT_TRANSACTION_LIMIT).map((tx) => ({
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      transactionDate: tx.transactionDate,
    }));

    return {
      yearMonth,
      totalSpending,
      budgetSummary,
      recentTransactions,
    };
  }
}
