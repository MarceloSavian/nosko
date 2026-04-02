import type { Pool } from 'pg';
import type { IBankAccountOwnershipRepository } from '../../../data/domain/account/IBankAccountOwnershipRepository.js';

export class BankAccountOwnershipRepository implements IBankAccountOwnershipRepository {
  constructor(private readonly pool: Pool) {}

  async findAccountIdsByCustomerId(customerId: string): Promise<string[]> {
    const result = await this.pool.query<{ bank_account_id: string }>(
      'SELECT bank_account_id FROM bank_account_ownerships WHERE customer_id = $1',
      [customerId],
    );
    return result.rows.map((row) => row.bank_account_id);
  }

  async isOwner(customerId: string, bankAccountId: string): Promise<boolean> {
    const result = await this.pool.query<{ count: number }>(
      'SELECT COUNT(*)::int as count FROM bank_account_ownerships WHERE customer_id = $1 AND bank_account_id = $2',
      [customerId, bankAccountId],
    );
    return (result.rows[0]?.count ?? 0) > 0;
  }

  async insert(bankAccountId: string, customerId: string, partnershipId?: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO bank_account_ownerships (bank_account_id, customer_id, partnership_id) VALUES ($1, $2, $3)',
      [bankAccountId, customerId, partnershipId ?? null],
    );
  }

  async deleteByPartnershipAndCustomer(partnershipId: string, customerId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM bank_account_ownerships WHERE partnership_id = $1 AND customer_id = $2',
      [partnershipId, customerId],
    );
  }
}
