import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { InvitationNotFoundError } from '@/domain/errors/partnership';
import type { Partnership } from '@/domain/models/partnership/Partnership';
import { RemoteAcceptInvitation } from './RemoteAcceptInvitation';

const partnership: Partnership = {
  id: 'p-1',
  invitationId: 'inv-1',
  customerAId: 'user-1',
  customerBId: 'user-2',
  createdAt: '2026-01-01T00:00:00Z',
};

const makeGateway = (): IPartnershipGateway =>
  ({
    acceptInvitation: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteAcceptInvitation', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteAcceptInvitation(gateway);
    return { sut, gateway };
  };

  it('should call gateway.acceptInvitation with correct id', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'acceptInvitation').mockResolvedValueOnce(partnership);

    await sut.execute('inv-1');

    expect(gateway.acceptInvitation).toHaveBeenCalledWith('inv-1');
  });

  it('should return partnership on success', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'acceptInvitation').mockResolvedValueOnce(partnership);

    const result = await sut.execute('inv-1');

    expect(result).toEqual(partnership);
  });

  it('should rethrow InvitationNotFoundError', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'acceptInvitation').mockRejectedValueOnce(new InvitationNotFoundError());

    await expect(sut.execute('inv-1')).rejects.toThrow(InvitationNotFoundError);
  });

  it('should throw UnexpectedError for unknown errors', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'acceptInvitation').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute('inv-1')).rejects.toThrow(UnexpectedError);
  });
});
