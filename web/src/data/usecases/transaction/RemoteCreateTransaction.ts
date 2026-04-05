import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import type { CreateTransactionInput, Transaction } from '@/domain/models/transaction/Transaction';
import type { ICreateTransaction } from '@/domain/usecases/transaction/ICreateTransaction';

export class RemoteCreateTransaction implements ICreateTransaction {
  private readonly gateway: ITransactionGateway;

  constructor(gateway: ITransactionGateway) {
    this.gateway = gateway;
  }

  async execute(input: CreateTransactionInput): Promise<Transaction> {
    try {
      return await this.gateway.create(input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
