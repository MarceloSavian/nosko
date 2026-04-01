export interface IVerificationTokenRepository {
  insert(customerId: string, code: string, expiresAt: Date): Promise<void>;
  find(customerId: string, code: string): Promise<{ id: string; expiresAt: Date } | null>;
  delete(id: string): Promise<void>;
}
