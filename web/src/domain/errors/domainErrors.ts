import {
  EmailAlreadyRegisteredError,
  EmailAlreadyVerifiedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidVerificationCodeError,
  VerificationCodeExpiredError,
} from './auth';
import {
  InvitationNotFoundError,
  PartnershipAlreadyExistsError,
  PartnershipNotFoundError,
} from './partnership';

type ErrorConstructor = new (...args: never[]) => Error;

export const domainErrors: Record<string, ErrorConstructor> = {
  EmailAlreadyRegisteredError,
  EmailAlreadyVerifiedError,
  EmailNotVerifiedError,
  InvalidCredentialsError,
  InvalidVerificationCodeError,
  VerificationCodeExpiredError,
  InvitationNotFoundError,
  PartnershipAlreadyExistsError,
  PartnershipNotFoundError,
};
