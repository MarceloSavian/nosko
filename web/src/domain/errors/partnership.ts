export class PartnershipNotFoundError extends Error {
  constructor() {
    super('Partnership not found');
    this.name = 'PartnershipNotFoundError';
  }
}

export class InvitationNotFoundError extends Error {
  constructor() {
    super('Invitation not found');
    this.name = 'InvitationNotFoundError';
  }
}

export class PartnershipAlreadyExistsError extends Error {
  constructor() {
    super('Partnership already exists');
    this.name = 'PartnershipAlreadyExistsError';
  }
}
