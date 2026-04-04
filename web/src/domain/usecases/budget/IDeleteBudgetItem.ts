export interface IDeleteBudgetItem {
  execute(planId: string, itemId: string): Promise<void>;
}
