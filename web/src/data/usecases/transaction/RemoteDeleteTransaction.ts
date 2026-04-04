import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import { TransactionNotFoundError } from '@/domain/errors/transaction';
import type { IDeleteTransaction } from '@/domain/usecases/transaction/IDeleteTransaction';

export class RemoteDeleteTransaction implements IDeleteTransaction {
  private readonly gateway: ITransactionGateway;

  constructor(gateway: ITransactionGateway) {
    this.gateway = gateway;
  }

  async execute(id: string): Promise<void> {
    try {
      await this.gateway.remove(id);
    } catch (error) {
      if (error instanceof TransactionNotFoundError) throw error;
      throw new UnexpectedError();
    }
  }
}
