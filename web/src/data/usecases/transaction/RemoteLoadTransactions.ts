import type { ITransactionGateway } from '@/data/protocols/transaction/ITransactionGateway';
import { UnexpectedError } from '@/domain/errors/auth';
import type { PaginatedTransactions } from '@/domain/models/transaction/Transaction';
import type {
  ILoadTransactions,
  LoadTransactionsParams,
} from '@/domain/usecases/transaction/ILoadTransactions';

export class RemoteLoadTransactions implements ILoadTransactions {
  private readonly gateway: ITransactionGateway;

  constructor(gateway: ITransactionGateway) {
    this.gateway = gateway;
  }

  async execute(params: LoadTransactionsParams): Promise<PaginatedTransactions> {
    try {
      return await this.gateway.load(params);
    } catch {
      throw new UnexpectedError();
    }
  }
}
