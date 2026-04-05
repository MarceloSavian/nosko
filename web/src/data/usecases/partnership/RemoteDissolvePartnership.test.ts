import { describe, expect, it, vi } from 'vitest';
import type { IPartnershipGateway } from '@/data/protocols/partnership/IPartnershipGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { PartnershipNotFoundError } from '@/domain/errors/partnership';
import { RemoteDissolvePartnership } from './RemoteDissolvePartnership';

const makeGateway = (): IPartnershipGateway =>
  ({
    dissolvePartnership: vi.fn(),
  }) as unknown as IPartnershipGateway;

describe('RemoteDissolvePartnership', () => {
  const makeSut = () => {
    const gateway = makeGateway();
    const sut = new RemoteDissolvePartnership(gateway);
    return { sut, gateway };
  };

  it('should call gateway.dissolvePartnership', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'dissolvePartnership').mockResolvedValueOnce();

    await sut.execute();

    expect(gateway.dissolvePartnership).toHaveBeenCalledOnce();
  });

  it('should rethrow PartnershipNotFoundError', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'dissolvePartnership').mockRejectedValueOnce(new PartnershipNotFoundError());

    await expect(sut.execute()).rejects.toThrow(PartnershipNotFoundError);
  });

  it('should throw UnexpectedError for unknown errors', async () => {
    const { sut, gateway } = makeSut();
    vi.spyOn(gateway, 'dissolvePartnership').mockRejectedValueOnce(new Error('network'));

    await expect(sut.execute()).rejects.toThrow(UnexpectedError);
  });
});
