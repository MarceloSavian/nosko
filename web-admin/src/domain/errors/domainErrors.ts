import {
  AdminEmailConflictError,
  AdminNotFoundError,
  AdminPasswordNotSetError,
  CategoryNotFoundError,
  CustomerNotFoundError,
  InstitutionNotFoundError,
  InvalidCredentialsError,
  InvalidResetCodeError,
  ResetCodeExpiredError,
} from './auth';

type ErrorConstructor = new (...args: never[]) => Error;

export const domainErrors: Record<string, ErrorConstructor> = {
  AdminEmailConflictError,
  AdminNotFoundError,
  AdminPasswordNotSetError,
  CategoryNotFoundError,
  CustomerNotFoundError,
  InstitutionNotFoundError,
  InvalidCredentialsError,
  InvalidResetCodeError,
  ResetCodeExpiredError,
};
