import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { ContributionRule } from '@/domain/models/partnership/Partnership';
import { RemoteLoadContributionRules } from './RemoteLoadContributionRules';

const rule: ContributionRule = {
  id: 'rule-1',
  partnershipId: 'p-1',
  type: 'EQUAL',
  customerAPercentage: 50,
  customerBPercentage: 50,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const makeGateway = (): IPartnershipGateway =>
  ({
    loadContributionRules: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteLoadContributionRules', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteLoadContributionRules(gateway);
    return { sut, gateway };
  };

  it('should call gateway.loadContributionRules', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadContributionRules').mockResolvedValueOnce(rule);

    await sut.execute();

    expect(gateway.loadContributionRules).toHaveBeenCalledOnce();
  });

  it('should return contribution rule on success', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadContributionRules').mockResolvedValueOnce(rule);

    const result = await sut.execute();

    expect(result).toEqual(rule);
  });

  it('should throw UnexpectedError on failure', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadContributionRules').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute()).rejects.toThrow(UnexpectedError);
  });
});
