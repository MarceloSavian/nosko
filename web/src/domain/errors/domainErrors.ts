import { AccountNotFoundError } from './account';
import {
  EmailAlreadyRegisteredError,
  EmailAlreadyVerifiedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidVerificationCodeError,
  VerificationCodeExpiredError,
} from './auth';
import { InvalidResetCodeError, ResetCodeExpiredError } from './password-reset';
import { ProfileNotFoundError } from './profile';
import { TransactionNotFoundError } from './transaction';

type ErrorConstructor = new (...args: never[]) => Error;

export const domainErrors: Record<string, ErrorConstructor> = {
  AccountNotFoundError,
  EmailAlreadyRegisteredError,
  EmailAlreadyVerifiedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidResetCodeError,
  InvalidVerificationCodeError,
  ProfileNotFoundError,
  ResetCodeExpiredError,
  VerificationCodeExpiredError,
  TransactionNotFoundError,
};
