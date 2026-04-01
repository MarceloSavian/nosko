export interface DashboardData {
  yearMonth: string;
  totalSpending: number;
  budgetSummary: {
    categoryName: string;
    planned: number;
    actual: number;
  }[];
  recentTransactions: {
    id: string;
    description: string | null;
    amount: number;
    transactionDate: string;
  }[];
}

export interface IDashboardService {
  getDashboard(customerId: string, yearMonth: string): Promise<DashboardData>;
}
