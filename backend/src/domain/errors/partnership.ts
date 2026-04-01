import { BaseError } from '../../shared/error.js';

export class InvitationNotFoundError extends BaseError {
  constructor() {
    super('Invitation not found', 404);
  }
}

export class CannotInviteSelfError extends BaseError {
  constructor() {
    super('Cannot invite yourself', 400);
  }
}

export class AlreadyHasPartnerError extends BaseError {
  constructor() {
    super('You already have a partner', 400);
  }
}

export class InvitationNotPendingError extends BaseError {
  constructor() {
    super('Invitation is not pending', 400);
  }
}

export class PartnershipNotFoundError extends BaseError {
  constructor() {
    super('Partnership not found', 404);
  }
}

export class NotPartnershipMemberError extends BaseError {
  constructor() {
    super('You are not a member of this partnership', 403);
  }
}
