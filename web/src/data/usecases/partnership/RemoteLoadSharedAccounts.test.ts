import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { BankAccount } from '@/domain/models/partnership/Partnership';
import { RemoteLoadSharedAccounts } from './RemoteLoadSharedAccounts';

const accounts: BankAccount[] = [
  {
    id: 'acc-1',
    institutionId: 'inst-1',
    accountName: 'Shared Checking',
    currencyCode: 'USD',
    balance: 5000,
    accountType: 'CHECKING',
    balanceUpdatedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const makeGateway = (): IPartnershipGateway =>
  ({
    loadSharedAccounts: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteLoadSharedAccounts', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteLoadSharedAccounts(gateway);
    return { sut, gateway };
  };

  it('should call gateway.loadSharedAccounts', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadSharedAccounts').mockResolvedValueOnce(accounts);

    await sut.execute();

    expect(gateway.loadSharedAccounts).toHaveBeenCalledOnce();
  });

  it('should return shared accounts on success', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadSharedAccounts').mockResolvedValueOnce(accounts);

    const result = await sut.execute();

    expect(result).toEqual(accounts);
  });

  it('should throw UnexpectedError on failure', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadSharedAccounts').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute()).rejects.toThrow(UnexpectedError);
  });
});
