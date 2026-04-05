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

type ErrorConstructor = new (...args: never[]) => Error;

export const domainErrors: Record<string, ErrorConstructor> = {
  EmailAlreadyRegisteredError,
  EmailAlreadyVerifiedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidResetCodeError,
  InvalidVerificationCodeError,
  ProfileNotFoundError,
  ResetCodeExpiredError,
  VerificationCodeExpiredError,
};
