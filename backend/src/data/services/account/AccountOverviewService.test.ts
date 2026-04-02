import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockOwnershipRepository } from '../../../test/mocks/MockBankAccountOwnershipRepository.js';
import { mockBankAccountRepository } from '../../../test/mocks/MockBankAccountRepository.js';
import { AccountOverviewService } from './AccountOverviewService.js';

describe('AccountOverviewService', () => {
  const makeSut = () => {
    const sut = new AccountOverviewService(mockBankAccountRepository, mockOwnershipRepository);
    return { sut };
  };

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockBankAccountRepository);
    resetMock(mockOwnershipRepository);
  });

  describe('getOverview()', () => {
    it('should return empty when no accounts owned', async () => {
      const { sut } = makeSut();

      const result = await sut.getOverview('customer-id');

      assert.deepEqual(result, { totalsByCurrency: [] });
    });

    it('should return totals by currency', async () => {
      const { sut } = makeSut();
      const totals = [
        { currencyCode: 'EUR', total: 1245000 },
        { currencyCode: 'USD', total: 4291000 },
      ];
      mock.method(mockOwnershipRepository, 'findAccountIdsByCustomerId', async () => [
        'acc-1',
        'acc-2',
      ]);
      mock.method(mockBankAccountRepository, 'getOverviewByAccountIds', async () => totals);

      const result = await sut.getOverview('customer-id');

      assert.deepEqual(result, { totalsByCurrency: totals });
    });
  });
});
