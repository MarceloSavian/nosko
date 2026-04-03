import {
  AlreadyHasPartnerError,
  CannotInviteSelfError,
  InvitationNotFoundError,
  InvitationNotPendingError,
  InviteeNotRegisteredError,
  NotPartnershipMemberError,
  PartnershipNotFoundError,
  SharedAccountNotOwnedError,
} from '../../../domain/errors/partnership.js';
import type { BankAccountSchema } from '../../../domain/models/account/Account.js';
import { InvitationStatus } from '../../../domain/models/partnership/Partnership.js';
import type {
  ContributionRuleSchema,
  InvitePartnerInput,
  PartnerInvitationSchema,
  PartnershipSchema,
  SetContributionRuleInput,
  SetSharedAccountsInput,
} from '../../../domain/models/partnership/Partnership.js';
import type { IPartnershipService } from '../../../domain/usecases/partnership/IPartnershipService.js';
import type { IBankAccountOwnershipRepository } from '../../domain/account/IBankAccountOwnershipRepository.js';
import type { IBankAccountRepository } from '../../domain/account/IBankAccountRepository.js';
import type { ICustomerRepository } from '../../domain/customer/ICustomerRepository.js';
import type { IEmailService } from '../../domain/email/IEmailService.js';
import type { IContributionRuleRepository } from '../../domain/partnership/IContributionRuleRepository.js';
import type { IPartnerInvitationRepository } from '../../domain/partnership/IPartnerInvitationRepository.js';
import type { IPartnershipRepository } from '../../domain/partnership/IPartnershipRepository.js';

export class PartnershipService implements IPartnershipService {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly invitationRepository: IPartnerInvitationRepository,
    private readonly partnershipRepository: IPartnershipRepository,
    private readonly contributionRuleRepository: IContributionRuleRepository,
    private readonly ownershipRepository: IBankAccountOwnershipRepository,
    private readonly emailService: IEmailService,
    private readonly bankAccountRepository: IBankAccountRepository,
  ) {}

  async invitePartner(
    customerId: string,
    input: InvitePartnerInput,
  ): Promise<PartnerInvitationSchema> {
    const customer = await this.customerRepository.findById(customerId);
    if (customer?.email === input.email) throw new CannotInviteSelfError();

    const invitee = await this.customerRepository.findByEmail(input.email);
    if (!invitee) throw new InviteeNotRegisteredError();

    const existing = await this.partnershipRepository.findByCustomerId(customerId);
    if (existing) throw new AlreadyHasPartnerError();

    const invitation = await this.invitationRepository.insert(customerId, input.email);

    await this.emailService.send(
      input.email,
      'You have been invited to join a shared ledger',
      `<p><strong>${customer?.name ?? customer?.email}</strong> has invited you to share finances on Nosko.</p><p>Open the app to accept or decline the invitation.</p>`,
    );

    return invitation;
  }

  async listInvitations(customerId: string): Promise<PartnerInvitationSchema[]> {
    return await this.invitationRepository.findByCustomerId(customerId);
  }

  async acceptInvitation(customerId: string, invitationId: string): Promise<PartnershipSchema> {
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) throw new InvitationNotFoundError();
    if (invitation.status !== InvitationStatus.PENDING) throw new InvitationNotPendingError();

    const customer = await this.customerRepository.findById(customerId);
    if (customer?.email !== invitation.inviteeEmail) throw new InvitationNotFoundError();

    const existing = await this.partnershipRepository.findByCustomerId(customerId);
    if (existing) throw new AlreadyHasPartnerError();

    await this.invitationRepository.updateStatus(
      invitationId,
      InvitationStatus.ACCEPTED,
      new Date(),
    );

    return await this.partnershipRepository.insert(invitationId, invitation.inviterId, customerId);
  }

  async declineInvitation(customerId: string, invitationId: string): Promise<void> {
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) throw new InvitationNotFoundError();
    if (invitation.status !== InvitationStatus.PENDING) throw new InvitationNotPendingError();

    const customer = await this.customerRepository.findById(customerId);
    if (customer?.email !== invitation.inviteeEmail) throw new InvitationNotFoundError();

    await this.invitationRepository.updateStatus(invitationId, InvitationStatus.DECLINED);
  }

  async cancelInvitation(customerId: string, invitationId: string): Promise<void> {
    const invitation = await this.invitationRepository.findById(invitationId);
    if (!invitation) throw new InvitationNotFoundError();
    if (invitation.inviterId !== customerId) throw new InvitationNotFoundError();
    if (invitation.status !== InvitationStatus.PENDING) throw new InvitationNotPendingError();

    await this.invitationRepository.delete(invitationId);
  }

  async getPartnership(customerId: string): Promise<PartnershipSchema> {
    const partnership = await this.partnershipRepository.findByCustomerId(customerId);
    if (!partnership) throw new PartnershipNotFoundError();
    return partnership;
  }

  async dissolvePartnership(customerId: string): Promise<void> {
    const partnership = await this.partnershipRepository.findByCustomerId(customerId);
    if (!partnership) throw new PartnershipNotFoundError();
    await this.partnershipRepository.delete(partnership.id);
  }

  private async requirePartnership(customerId: string): Promise<PartnershipSchema> {
    const partnership = await this.partnershipRepository.findByCustomerId(customerId);
    if (!partnership) throw new PartnershipNotFoundError();
    if (partnership.customerAId !== customerId && partnership.customerBId !== customerId) {
      throw new NotPartnershipMemberError();
    }
    return partnership;
  }

  async getContributionRules(customerId: string): Promise<ContributionRuleSchema | null> {
    const partnership = await this.requirePartnership(customerId);
    return await this.contributionRuleRepository.findByPartnershipId(partnership.id);
  }

  async setContributionRules(
    customerId: string,
    input: SetContributionRuleInput,
  ): Promise<ContributionRuleSchema> {
    const partnership = await this.requirePartnership(customerId);
    return await this.contributionRuleRepository.upsert(
      partnership.id,
      input.type,
      input.customerAPercentage,
      input.customerBPercentage,
    );
  }

  async getSharedAccounts(customerId: string): Promise<BankAccountSchema[]> {
    const partnership = await this.requirePartnership(customerId);
    const partnerId =
      partnership.customerAId === customerId ? partnership.customerBId : partnership.customerAId;
    const partnerAccountIds = await this.ownershipRepository.findAccountIdsByCustomerId(partnerId);
    if (partnerAccountIds.length === 0) return [];
    return this.bankAccountRepository.findByIds(partnerAccountIds);
  }

  async setSharedAccounts(
    customerId: string,
    input: SetSharedAccountsInput,
  ): Promise<BankAccountSchema[]> {
    const partnership = await this.requirePartnership(customerId);
    const partnerId =
      partnership.customerAId === customerId ? partnership.customerBId : partnership.customerAId;

    for (const accountId of input.bankAccountIds) {
      const isOwner = await this.ownershipRepository.isOwner(customerId, accountId);
      if (!isOwner) throw new SharedAccountNotOwnedError();
    }

    await this.ownershipRepository.deleteByPartnershipAndCustomer(partnership.id, partnerId);

    for (const accountId of input.bankAccountIds) {
      await this.ownershipRepository.insert(accountId, partnerId, partnership.id);
    }

    if (input.bankAccountIds.length === 0) return [];
    return this.bankAccountRepository.findByIds(input.bankAccountIds);
  }
}
