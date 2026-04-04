import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import { UnexpectedError } from '@/domain/errors/auth';
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
    } catch {
      throw new UnexpectedError();
    }
  }
}
