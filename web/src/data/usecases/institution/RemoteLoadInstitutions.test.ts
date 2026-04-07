import { describe, expect, it, vi } from 'vitest';
import type { IInstitutionGateway } from '@/data/protocols/institution/IInstitutionGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { Institution } from '@/domain/models/institution/Institution';
import { RemoteLoadInstitutions } from './RemoteLoadInstitutions';

const institutionsList: Institution[] = [
  { id: 'inst-1', name: 'Bank of America', countryCode: 'US', logoUrl: 'https://logo.com/boa.png' },
  { id: 'inst-2', name: 'Nubank', countryCode: 'BR', logoUrl: null },
];

describe('RemoteLoadInstitutions', () => {
  const makeSut = () => {
    const gatewaySpy: IInstitutionGateway = { loadAll: vi.fn() };
    const sut = new RemoteLoadInstitutions(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('execute()', () => {
    it('should call gateway.loadAll', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadAll').mockResolvedValueOnce(institutionsList);

      await sut.execute();

      expect(gatewaySpy.loadAll).toHaveBeenCalledOnce();
    });

    it('should return the institutions list on success', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadAll').mockResolvedValueOnce(institutionsList);

      const result = await sut.execute();

      expect(result).toEqual(institutionsList);
    });

    it('should throw UnexpectedError on failure', async () => {
      const { sut, gatewaySpy } = makeSut();
      vi.spyOn(gatewaySpy, 'loadAll').mockRejectedValueOnce(new Error('network error'));

      await expect(sut.execute()).rejects.toThrow(UnexpectedError);
    });
  });
});
