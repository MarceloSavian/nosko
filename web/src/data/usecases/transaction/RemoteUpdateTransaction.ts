import { rethrowKnown } from '@/data/helpers/rethrowKnown';
import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import type { Transaction, UpdateTransactionInput } from '@/domain/models/transaction/Transaction';
import type { IUpdateTransaction } from '@/domain/usecases/transaction/IUpdateTransaction';

export class RemoteUpdateTransaction implements IUpdateTransaction {
  private readonly gateway: ITransactionGateway;

  constructor(gateway: ITransactionGateway) {
    this.gateway = gateway;
  }

  async execute(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    try {
      return await this.gateway.update(id, input);
    } catch (error) {
      rethrowKnown(error);
    }
  }
}
