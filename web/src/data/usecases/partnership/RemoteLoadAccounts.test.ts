import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { BankAccount } from '@/domain/models/partnership/Partnership';
import { RemoteLoadAccounts } from './RemoteLoadAccounts';

const accounts: BankAccount[] = [
  {
    id: 'acc-1',
    institutionId: 'inst-1',
    accountName: 'Checking',
    currencyCode: 'USD',
    balance: 10000,
    accountType: 'CHECKING',
    balanceUpdatedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const makeGateway = (): IPartnershipGateway =>
  ({
    loadAccounts: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteLoadAccounts', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteLoadAccounts(gateway);
    return { sut, gateway };
  };

  it('should call gateway.loadAccounts', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadAccounts').mockResolvedValueOnce(accounts);

    await sut.execute();

    expect(gateway.loadAccounts).toHaveBeenCalledOnce();
  });

  it('should return accounts on success', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadAccounts').mockResolvedValueOnce(accounts);

    const result = await sut.execute();

    expect(result).toEqual(accounts);
  });

  it('should throw UnexpectedError on failure', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadAccounts').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute()).rejects.toThrow(UnexpectedError);
  });
});
