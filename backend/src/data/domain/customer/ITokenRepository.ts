import type { TokenType } from '../../../domain/models/customer/Customer.js';

export interface ITokenRepository {
  insert(customerId: string, code: string, type: TokenType, expiresAt: Date): Promise<void>;
  find(
    customerId: string,
    code: string,
    type: TokenType,
  ): Promise<{ id: string; expiresAt: Date } | null>;
  deleteByCustomerAndType(customerId: string, type: TokenType): Promise<void>;
  delete(id: string): Promise<void>;
}
