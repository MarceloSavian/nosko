import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import {
  InvitationNotFoundError,
  PartnershipAlreadyExistsError,
  PartnershipNotFoundError,
} from '@/domain/errors/partnership';
import {
  type BankAccount,
  bankAccountSchema,
  type ContributionRule,
  contributionRuleSchema,
  type InvitePartnerInput,
  type PartnerInvitation,
  type Partnership,
  partnerInvitationSchema,
  partnershipSchema,
  type SetContributionRuleInput,
  type SetSharedAccountsInput,
} from '@/domain/models/partnership/Partnership';

export class PartnershipGateway implements IPartnershipGateway {
  private readonly httpClient: IHttpClient;
  private readonly getToken: () => string | null;

  constructor(httpClient: IHttpClient, getToken: () => string | null) {
    this.httpClient = httpClient;
    this.getToken = getToken;
  }

  private authHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) throw new UnexpectedError();
    return { Authorization: `Bearer ${token}` };
  }

  async invitePartner(input: InvitePartnerInput): Promise<PartnerInvitation> {
    const response = await this.httpClient.request({
      url: '/v1/partnership/invite',
      method: 'post',
      body: input,
      headers: this.authHeaders(),
    });

    if (response.statusCode === 201) {
      const parsed = partnerInvitationSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    if (response.statusCode === 409) throw new PartnershipAlreadyExistsError();
    throw new UnexpectedError();
  }

  async loadInvitations(): Promise<PartnerInvitation[]> {
    const response = await this.httpClient.request({
      url: '/v1/partnership/invitations',
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = partnerInvitationSchema.array().safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }

  async acceptInvitation(id: string): Promise<Partnership> {
    const response = await this.httpClient.request({
      url: `/v1/partnership/invitations/${id}/accept`,
      method: 'post',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = partnershipSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    if (response.statusCode === 404) throw new InvitationNotFoundError();
    throw new UnexpectedError();
  }

  async declineInvitation(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/partnership/invitations/${id}/decline`,
      method: 'post',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 204) return;
    if (response.statusCode === 404) throw new InvitationNotFoundError();
    throw new UnexpectedError();
  }

  async cancelInvitation(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `/v1/partnership/invitations/${id}`,
      method: 'delete',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 204) return;
    if (response.statusCode === 404) throw new InvitationNotFoundError();
    throw new UnexpectedError();
  }

  async loadPartnership(): Promise<Partnership | null> {
    const response = await this.httpClient.request({
      url: '/v1/partnership',
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = partnershipSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    if (response.statusCode === 404) return null;
    throw new UnexpectedError();
  }

  async dissolvePartnership(): Promise<void> {
    const response = await this.httpClient.request({
      url: '/v1/partnership',
      method: 'delete',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 204) return;
    if (response.statusCode === 404) throw new PartnershipNotFoundError();
    throw new UnexpectedError();
  }

  async loadContributionRules(): Promise<ContributionRule> {
    const response = await this.httpClient.request({
      url: '/v1/partnership/contribution-rules',
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = contributionRuleSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }

  async setContributionRules(input: SetContributionRuleInput): Promise<ContributionRule> {
    const response = await this.httpClient.request({
      url: '/v1/partnership/contribution-rules',
      method: 'put',
      body: input,
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = contributionRuleSchema.safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }

  async loadSharedAccounts(): Promise<BankAccount[]> {
    const response = await this.httpClient.request({
      url: '/v1/partnership/shared-accounts',
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = bankAccountSchema.array().safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }

  async setSharedAccounts(input: SetSharedAccountsInput): Promise<BankAccount[]> {
    const response = await this.httpClient.request({
      url: '/v1/partnership/shared-accounts',
      method: 'put',
      body: input,
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = bankAccountSchema.array().safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }

  async loadAccounts(): Promise<BankAccount[]> {
    const response = await this.httpClient.request({
      url: '/v1/accounts',
      method: 'get',
      headers: this.authHeaders(),
    });

    if (response.statusCode === 200) {
      const parsed = bankAccountSchema.array().safeParse(response.body);
      if (parsed.success) return parsed.data;
    }
    throw new UnexpectedError();
  }
}
