export interface IDeleteBudgetPlan {
  execute(id: string): Promise<void>;
}
