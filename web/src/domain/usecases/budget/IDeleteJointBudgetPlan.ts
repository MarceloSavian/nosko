export interface IDeleteJointBudgetPlan {
  execute(id: string): Promise<void>;
}
