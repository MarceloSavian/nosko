import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { PartnerInvitation } from '@/domain/models/partnership/Partnership';
import { RemoteLoadInvitations } from './RemoteLoadInvitations';

const invitations: PartnerInvitation[] = [
  {
    id: 'inv-1',
    inviterId: 'user-1',
    inviteeEmail: 'partner@example.com',
    status: 'PENDING',
    acceptedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const makeGateway = (): IPartnershipGateway =>
  ({
    loadInvitations: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteLoadInvitations', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteLoadInvitations(gateway);
    return { sut, gateway };
  };

  it('should call gateway.loadInvitations', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadInvitations').mockResolvedValueOnce(invitations);

    await sut.execute();

    expect(gateway.loadInvitations).toHaveBeenCalledOnce();
  });

  it('should return invitations on success', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadInvitations').mockResolvedValueOnce(invitations);

    const result = await sut.execute();

    expect(result).toEqual(invitations);
  });

  it('should throw UnexpectedError on failure', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'loadInvitations').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute()).rejects.toThrow(UnexpectedError);
  });
});
