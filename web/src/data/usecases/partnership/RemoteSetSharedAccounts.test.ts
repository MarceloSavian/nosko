import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { BankAccount, SetSharedAccountsInput } from '@/domain/models/partnership/Partnership';
import { RemoteSetSharedAccounts } from './RemoteSetSharedAccounts';

const input: SetSharedAccountsInput = {
  bankAccountIds: ['acc-1', 'acc-2'],
};

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
    setSharedAccounts: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteSetSharedAccounts', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteSetSharedAccounts(gateway);
    return { sut, gateway };
  };

  it('should call gateway.setSharedAccounts with correct input', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'setSharedAccounts').mockResolvedValueOnce(accounts);

    await sut.execute(input);

    expect(gateway.setSharedAccounts).toHaveBeenCalledWith(input);
  });

  it('should return accounts on success', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'setSharedAccounts').mockResolvedValueOnce(accounts);

    const result = await sut.execute(input);

    expect(result).toEqual(accounts);
  });

  it('should throw UnexpectedError on failure', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'setSharedAccounts').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute(input)).rejects.toThrow(UnexpectedError);
  });
});
