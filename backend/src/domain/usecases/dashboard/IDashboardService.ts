export interface DashboardData {
  yearMonth: string;
  totalSpending: string;
  budgetSummary: {
    categoryName: string;
    planned: string;
    actual: string;
  }[];
  recentTransactions: {
    id: string;
    description: string | null;
    amount: string;
    transactionDate: string;
  }[];
}

export interface IDashboardService {
  getDashboard(customerId: string, yearMonth: string): Promise<DashboardData>;
}
