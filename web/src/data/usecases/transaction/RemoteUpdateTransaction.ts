import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { TransactionNotFoundError } from '@/domain/errors/transaction';
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
      if (error instanceof TransactionNotFoundError) throw error;
      throw new UnexpectedError();
    }
  }
}
