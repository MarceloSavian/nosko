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
import {
  InvitationNotFoundError,
  PartnershipAlreadyExistsError,
  PartnershipNotFoundError,
} from './partnership';
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
  InvitationNotFoundError,
  InvalidCredentialsError,
  InvalidResetCodeError,
  InvalidVerificationCodeError,
  PartnershipAlreadyExistsError,
  PartnershipNotFoundError,
  ProfileNotFoundError,
  ResetCodeExpiredError,
  TransactionNotFoundError,
  VerificationCodeExpiredError,
};
