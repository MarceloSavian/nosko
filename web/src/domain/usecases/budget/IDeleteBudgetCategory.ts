export interface IDeleteBudgetCategory {
  execute(id: string): Promise<void>;
}
