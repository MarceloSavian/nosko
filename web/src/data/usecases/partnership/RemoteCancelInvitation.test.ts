import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { InvitationNotFoundError } from '@/domain/errors/partnership';
import { RemoteCancelInvitation } from './RemoteCancelInvitation';

const makeGateway = (): IPartnershipGateway =>
  ({
    cancelInvitation: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteCancelInvitation', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteCancelInvitation(gateway);
    return { sut, gateway };
  };

  it('should call gateway.cancelInvitation with correct id', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'cancelInvitation').mockResolvedValueOnce();

    await sut.execute('inv-1');

    expect(gateway.cancelInvitation).toHaveBeenCalledWith('inv-1');
  });

  it('should rethrow InvitationNotFoundError', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'cancelInvitation').mockRejectedValueOnce(new InvitationNotFoundError());

    await expect(sut.execute('inv-1')).rejects.toThrow(InvitationNotFoundError);
  });

  it('should throw UnexpectedError for unknown errors', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'cancelInvitation').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute('inv-1')).rejects.toThrow(UnexpectedError);
  });
});
