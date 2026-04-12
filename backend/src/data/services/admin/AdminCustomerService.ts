import { CustomerNotFoundError } from '../../../domain/errors/customer.js';
import type { CustomerSchema } from '../../../domain/models/customer/Customer.js';
import type { IAdminCustomerService } from '../../../domain/usecases/admin/IAdminCustomerService.js';
import type { ICustomerRepository } from '../../domain/customer/ICustomerRepository.js';

export class AdminCustomerService implements IAdminCustomerService {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async listCustomers(
    limit: number,
    offset: number,
  ): Promise<{ customers: CustomerSchema[]; total: number }> {
    const [customers, total] = await Promise.all([
      this.customerRepository.findAllPaginated(limit, offset),
      this.customerRepository.count(),
    ]);
    return { customers, total };
  }

  async getCustomer(id: string): Promise<CustomerSchema> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) throw new CustomerNotFoundError();
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) throw new CustomerNotFoundError();
    await this.customerRepository.delete(id);
  }
}
