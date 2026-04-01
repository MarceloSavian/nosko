import { BaseError } from '../../shared/error.js';

export class BudgetCategoryNotFoundError extends BaseError {
  constructor() {
    super('Budget category not found', 404);
  }
}

export class CannotModifySystemCategoryError extends BaseError {
  constructor() {
    super('Cannot modify a system category', 403);
  }
}

export class BudgetPlanNotFoundError extends BaseError {
  constructor() {
    super('Budget plan not found', 404);
  }
}

export class BudgetItemNotFoundError extends BaseError {
  constructor() {
    super('Budget item not found', 404);
  }
}
