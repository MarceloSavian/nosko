import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { PartnershipAlreadyExistsError } from '@/domain/errors/partnership';
import type {
  InvitePartnerInput,
  PartnerInvitation,
} from '@/domain/models/partnership/Partnership';
import { RemoteInvitePartner } from './RemoteInvitePartner';

const input: InvitePartnerInput = { email: 'partner@example.com' };

const invitation: PartnerInvitation = {
  id: 'inv-1',
  inviterId: 'user-1',
  inviteeEmail: 'partner@example.com',
  status: 'PENDING',
  acceptedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const makeGateway = (): IPartnershipGateway =>
  ({
    invitePartner: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteInvitePartner', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteInvitePartner(gateway);
    return { sut, gateway };
  };

  it('should call gateway.invitePartner with correct input', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'invitePartner').mockResolvedValueOnce(invitation);

    await sut.execute(input);

    expect(gateway.invitePartner).toHaveBeenCalledWith(input);
    expect(gateway.invitePartner).toHaveBeenCalledOnce();
  });

  it('should return the invitation on success', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'invitePartner').mockResolvedValueOnce(invitation);

    const result = await sut.execute(input);

    expect(result).toEqual(invitation);
  });

  it('should rethrow PartnershipAlreadyExistsError', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'invitePartner').mockRejectedValueOnce(new PartnershipAlreadyExistsError());

    await expect(sut.execute(input)).rejects.toThrow(PartnershipAlreadyExistsError);
  });

  it('should throw UnexpectedError for unknown errors', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'invitePartner').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute(input)).rejects.toThrow(UnexpectedError);
  });
});
