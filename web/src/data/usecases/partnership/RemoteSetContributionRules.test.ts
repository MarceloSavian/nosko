import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type {
  ContributionRule,
  SetContributionRuleInput,
} from '@/domain/models/partnership/Partnership';
import { RemoteSetContributionRules } from './RemoteSetContributionRules';

const input: SetContributionRuleInput = {
  type: 'CUSTOM_PERCENTAGE',
  customerAPercentage: 60,
  customerBPercentage: 40,
};

const rule: ContributionRule = {
  id: 'rule-1',
  partnershipId: 'p-1',
  type: 'CUSTOM_PERCENTAGE',
  customerAPercentage: 60,
  customerBPercentage: 40,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const makeGateway = (): IPartnershipGateway =>
  ({
    setContributionRules: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteSetContributionRules', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteSetContributionRules(gateway);
    return { sut, gateway };
  };

  it('should call gateway.setContributionRules with correct input', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'setContributionRules').mockResolvedValueOnce(rule);

    await sut.execute(input);

    expect(gateway.setContributionRules).toHaveBeenCalledWith(input);
  });

  it('should return contribution rule on success', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'setContributionRules').mockResolvedValueOnce(rule);

    const result = await sut.execute(input);

    expect(result).toEqual(rule);
  });

  it('should throw UnexpectedError on failure', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'setContributionRules').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute(input)).rejects.toThrow(UnexpectedError);
  });
});
