export class BudgetPlanNotFoundError extends Error {
  constructor() {
    super('Budget plan not found');
    this.name = 'BudgetPlanNotFoundError';
  }
}

export class BudgetCategoryNotFoundError extends Error {
  constructor() {
    super('Budget category not found');
    this.name = 'BudgetCategoryNotFoundError';
  }
}

export class BudgetItemNotFoundError extends Error {
  constructor() {
    super('Budget item not found');
    this.name = 'BudgetItemNotFoundError';
  }
}
