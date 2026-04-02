export interface IBankAccountOwnershipRepository {
  findAccountIdsByCustomerId(customerId: string): Promise<string[]>;
  isOwner(customerId: string, bankAccountId: string): Promise<boolean>;
  insert(bankAccountId: string, customerId: string, partnershipId?: string): Promise<void>;
  deleteByPartnershipAndCustomer(partnershipId: string, customerId: string): Promise<void>;
}
