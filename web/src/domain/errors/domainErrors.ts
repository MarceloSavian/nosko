import { AccountNotFoundError } from './account';
import {
  EmailAlreadyRegisteredError,
  EmailAlreadyVerifiedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidVerificationCodeError,
  VerificationCodeExpiredError,
} from './auth';
import {
  BudgetCategoryNotFoundError,
  BudgetItemNotFoundError,
  BudgetPlanNotFoundError,
} from './budget';
import { InvalidResetCodeError, ResetCodeExpiredError } from './password-reset';
import { ProfileNotFoundError } from './profile';
import { TransactionNotFoundError } from './transaction';

type ErrorConstructor = new (...args: never[]) => Error;

export const domainErrors: Record<string, ErrorConstructor> = {
  AccountNotFoundError,
  BudgetCategoryNotFoundError,
  BudgetItemNotFoundError,
  BudgetPlanNotFoundError,
  EmailAlreadyRegisteredError,
  EmailAlreadyVerifiedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidResetCodeError,
  InvalidVerificationCodeError,
  ProfileNotFoundError,
  ResetCodeExpiredError,
  TransactionNotFoundError,
  VerificationCodeExpiredError,
};
