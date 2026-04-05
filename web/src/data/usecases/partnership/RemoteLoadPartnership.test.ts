import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { Partnership } from '@/domain/models/partnership/Partnership';
import { RemoteLoadPartnership } from './RemoteLoadPartnership';

const partnership: Partnership = {
  id: 'p-1',
  invitationId: 'inv-1',
  customerAId: 'user-1',
  customerBId: 'user-2',
  createdAt: '2026-01-01T00:00:00Z',
};

const makeGateway = (): IPartnershipGateway =>
  ({
    loadPartnership: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteLoadPartnership', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteLoadPartnership(gateway);
    return { sut, gateway };
  };

  it('should call gateway.loadPartnership', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadPartnership').mockResolvedValueOnce(partnership);

    await sut.execute();

    expect(gateway.loadPartnership).toHaveBeenCalledOnce();
  });

  it('should return partnership on success', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadPartnership').mockResolvedValueOnce(partnership);

    const result = await sut.execute();

    expect(result).toEqual(partnership);
  });

  it('should return null when no partnership exists', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadPartnership').mockResolvedValueOnce(null);

    const result = await sut.execute();

    expect(result).toBeNull();
  });

  it('should throw UnexpectedError on failure', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadPartnership').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute()).rejects.toThrow(UnexpectedError);
  });
});
