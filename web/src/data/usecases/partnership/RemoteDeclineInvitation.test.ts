import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { InvitationNotFoundError } from '@/domain/errors/partnership';
import { RemoteDeclineInvitation } from './RemoteDeclineInvitation';

const makeGateway = (): IPartnershipGateway =>
  ({
    declineInvitation: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteDeclineInvitation', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteDeclineInvitation(gateway);
    return { sut, gateway };
  };

  it('should call gateway.declineInvitation with correct id', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'declineInvitation').mockResolvedValueOnce();

    await sut.execute('inv-1');

    expect(gateway.declineInvitation).toHaveBeenCalledWith('inv-1');
  });

  it('should rethrow InvitationNotFoundError', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'declineInvitation').mockRejectedValueOnce(new InvitationNotFoundError());

    await expect(sut.execute('inv-1')).rejects.toThrow(InvitationNotFoundError);
  });

  it('should throw UnexpectedError for unknown errors', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'declineInvitation').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute('inv-1')).rejects.toThrow(UnexpectedError);
  });
});
