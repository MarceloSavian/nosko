import { describe, expect, it, vi } from 'vitest';
import type { IHttpClient } from '@/data/protocols/http/IHttpClient';
import { UnexpectedError } from '@/domain/errors/auth';
import {
  InvitationNotFoundError,
  PartnershipAlreadyExistsError,
  PartnershipNotFoundError,
} from '@/domain/errors/partnership';
import type {
  BankAccount,
  ContributionRule,
  PartnerInvitation,
  Partnership,
} from '@/domain/models/partnership/Partnership';
import { PartnershipGateway } from './PartnershipGateway';

const token = 'valid-jwt-token';
const authHeaders = { Authorization: `Bearer ${token}` };

const invitation: PartnerInvitation = {
  id: 'inv-1',
  inviterId: 'user-1',
  inviteeEmail: 'partner@example.com',
  status: 'PENDING',
  acceptedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const partnership: Partnership = {
  id: 'p-1',
  invitationId: 'inv-1',
  customerAId: 'user-1',
  customerBId: 'user-2',
  createdAt: '2026-01-01T00:00:00Z',
};

const contributionRule: ContributionRule = {
  id: 'rule-1',
  partnershipId: 'p-1',
  type: 'EQUAL',
  customerAPercentage: 50,
  customerBPercentage: 50,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const account: BankAccount = {
  id: 'acc-1',
  institutionId: 'inst-1',
  accountName: 'Checking',
  currencyCode: 'USD',
  balance: 10000,
  accountType: 'CHECKING',
  balanceUpdatedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('PartnershipGateway', () => {
  const makeSut = () => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const getToken = vi.fn().mockReturnValue(token);
    const sut = new PartnershipGateway(httpClientSpy, getToken);
    return { sut, httpClientSpy, getToken };
  };

  const makeSutWithoutToken = () => {
    const httpClientSpy: IHttpClient = { request: vi.fn() };
    const getToken = vi.fn().mockReturnValue(null);
    const sut = new PartnershipGateway(httpClientSpy, getToken);
    return { sut, httpClientSpy };
  };

  describe('invitePartner()', () => {
    const input = { email: 'partner@example.com' };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: invitation,
      });

      await sut.invitePartner(input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/invite',
        method: 'post',
        body: input,
        headers: authHeaders,
      });
    });

    it('should return invitation on 201', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 201,
        body: invitation,
      });

      const result = await sut.invitePartner(input);

      expect(result).toEqual(invitation);
    });

    it('should throw PartnershipAlreadyExistsError on 409', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 409,
        body: {},
      });

      await expect(sut.invitePartner(input)).rejects.toThrow(PartnershipAlreadyExistsError);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.invitePartner(input)).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.invitePartner(input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadInvitations()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [invitation],
      });

      await sut.loadInvitations();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/invitations',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return invitations on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [invitation],
      });

      const result = await sut.loadInvitations();

      expect(result).toEqual([invitation]);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadInvitations()).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.loadInvitations()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('acceptInvitation()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: partnership,
      });

      await sut.acceptInvitation('inv-1');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/invitations/inv-1/accept',
        method: 'post',
        headers: authHeaders,
      });
    });

    it('should return partnership on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: partnership,
      });

      const result = await sut.acceptInvitation('inv-1');

      expect(result).toEqual(partnership);
    });

    it('should throw InvitationNotFoundError on 404', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      await expect(sut.acceptInvitation('inv-1')).rejects.toThrow(InvitationNotFoundError);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.acceptInvitation('inv-1')).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.acceptInvitation('inv-1')).rejects.toThrow(UnexpectedError);
    });
  });

  describe('declineInvitation()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: undefined,
      });

      await sut.declineInvitation('inv-1');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/invitations/inv-1/decline',
        method: 'post',
        headers: authHeaders,
      });
    });

    it('should resolve on 204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: undefined,
      });

      await expect(sut.declineInvitation('inv-1')).resolves.toBeUndefined();
    });

    it('should throw InvitationNotFoundError on 404', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      await expect(sut.declineInvitation('inv-1')).rejects.toThrow(InvitationNotFoundError);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.declineInvitation('inv-1')).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.declineInvitation('inv-1')).rejects.toThrow(UnexpectedError);
    });
  });

  describe('cancelInvitation()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: undefined,
      });

      await sut.cancelInvitation('inv-1');

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/invitations/inv-1',
        method: 'delete',
        headers: authHeaders,
      });
    });

    it('should resolve on 204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: undefined,
      });

      await expect(sut.cancelInvitation('inv-1')).resolves.toBeUndefined();
    });

    it('should throw InvitationNotFoundError on 404', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      await expect(sut.cancelInvitation('inv-1')).rejects.toThrow(InvitationNotFoundError);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.cancelInvitation('inv-1')).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.cancelInvitation('inv-1')).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadPartnership()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: partnership,
      });

      await sut.loadPartnership();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return partnership on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: partnership,
      });

      const result = await sut.loadPartnership();

      expect(result).toEqual(partnership);
    });

    it('should return null on 404', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      const result = await sut.loadPartnership();

      expect(result).toBeNull();
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadPartnership()).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.loadPartnership()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('dissolvePartnership()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: undefined,
      });

      await sut.dissolvePartnership();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership',
        method: 'delete',
        headers: authHeaders,
      });
    });

    it('should resolve on 204', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 204,
        body: undefined,
      });

      await expect(sut.dissolvePartnership()).resolves.toBeUndefined();
    });

    it('should throw PartnershipNotFoundError on 404', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 404,
        body: {},
      });

      await expect(sut.dissolvePartnership()).rejects.toThrow(PartnershipNotFoundError);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.dissolvePartnership()).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.dissolvePartnership()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadContributionRules()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: contributionRule,
      });

      await sut.loadContributionRules();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/contribution-rules',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return contribution rule on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: contributionRule,
      });

      const result = await sut.loadContributionRules();

      expect(result).toEqual(contributionRule);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadContributionRules()).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.loadContributionRules()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('setContributionRules()', () => {
    const input = {
      type: 'CUSTOM_PERCENTAGE' as const,
      customerAPercentage: 60,
      customerBPercentage: 40,
    };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: contributionRule,
      });

      await sut.setContributionRules(input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/contribution-rules',
        method: 'put',
        body: input,
        headers: authHeaders,
      });
    });

    it('should return contribution rule on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: contributionRule,
      });

      const result = await sut.setContributionRules(input);

      expect(result).toEqual(contributionRule);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.setContributionRules(input)).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.setContributionRules(input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadSharedAccounts()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [account],
      });

      await sut.loadSharedAccounts();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/shared-accounts',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return accounts on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [account],
      });

      const result = await sut.loadSharedAccounts();

      expect(result).toEqual([account]);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadSharedAccounts()).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.loadSharedAccounts()).rejects.toThrow(UnexpectedError);
    });
  });

  describe('setSharedAccounts()', () => {
    const input = { bankAccountIds: ['acc-1', 'acc-2'] };

    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [account],
      });

      await sut.setSharedAccounts(input);

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/partnership/shared-accounts',
        method: 'put',
        body: input,
        headers: authHeaders,
      });
    });

    it('should return accounts on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [account],
      });

      const result = await sut.setSharedAccounts(input);

      expect(result).toEqual([account]);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.setSharedAccounts(input)).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.setSharedAccounts(input)).rejects.toThrow(UnexpectedError);
    });
  });

  describe('loadAccounts()', () => {
    it('should call httpClient with correct request', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [account],
      });

      await sut.loadAccounts();

      expect(httpClientSpy.request).toHaveBeenCalledWith({
        url: '/v1/accounts',
        method: 'get',
        headers: authHeaders,
      });
    });

    it('should return accounts on 200', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 200,
        body: [account],
      });

      const result = await sut.loadAccounts();

      expect(result).toEqual([account]);
    });

    it('should throw UnexpectedError on other status codes', async () => {
      const { sut, httpClientSpy } = makeSut();
      vi.spyOn(httpClientSpy, 'request').mockResolvedValueOnce({
        statusCode: 500,
        body: {},
      });

      await expect(sut.loadAccounts()).rejects.toThrow(UnexpectedError);
    });

    it('should throw UnexpectedError when token is missing', async () => {
      const { sut } = makeSutWithoutToken();

      await expect(sut.loadAccounts()).rejects.toThrow(UnexpectedError);
    });
  });
});
