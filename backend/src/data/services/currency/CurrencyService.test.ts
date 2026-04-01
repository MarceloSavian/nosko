import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { mockCurrencyDefaultRepository } from '../../../test/mocks/MockCurrencyDefaultRepository.js';
import { CurrencyService } from './CurrencyService.js';

describe('CurrencyService', () => {
  const makeSut = () => {
    const sut = new CurrencyService(mockCurrencyDefaultRepository);
    return { sut };
  };

  beforeEach(() => {
    mock.restoreAll();
    resetMock(mockCurrencyDefaultRepository);
  });

  describe('getCurrencyDefaults()', () => {
    it('should return currency defaults for the customer', async () => {
      const { sut } = makeSut();
      const currencies = [
        { id: '1', currencyCode: 'USD', displayOrder: 0 },
        { id: '2', currencyCode: 'EUR', displayOrder: 1 },
      ];
      mock.method(mockCurrencyDefaultRepository, 'findByCustomerId', async () => currencies);

      const result = await sut.getCurrencyDefaults('customer-id');

      assert.deepEqual(result, currencies);
      assert.equal(
        mockCurrencyDefaultRepository.findByCustomerId.mock.calls[0]?.arguments[0],
        'customer-id',
      );
    });
  });

  describe('setCurrencyDefaults()', () => {
    it('should replace all currency defaults', async () => {
      const { sut } = makeSut();
      const input = {
        currencies: [
          { currencyCode: 'USD', displayOrder: 0 },
          { currencyCode: 'GBP', displayOrder: 1 },
        ],
      };
      const result_data = [
        { id: '1', currencyCode: 'USD', displayOrder: 0 },
        { id: '2', currencyCode: 'GBP', displayOrder: 1 },
      ];
      mock.method(mockCurrencyDefaultRepository, 'replaceAll', async () => result_data);

      const result = await sut.setCurrencyDefaults('customer-id', input);

      assert.deepEqual(result, result_data);
      assert.equal(
        mockCurrencyDefaultRepository.replaceAll.mock.calls[0]?.arguments[0],
        'customer-id',
      );
    });
  });
});
