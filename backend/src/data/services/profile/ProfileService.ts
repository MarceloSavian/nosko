import { CustomerNotFoundError } from '../../../domain/errors/customer.js';
import type {
  CustomerSchema,
  UpdateProfileInput,
} from '../../../domain/models/customer/Customer.js';
import type { IProfileService } from '../../../domain/usecases/profile/IProfileService.js';
import type { ICustomerRepository } from '../../domain/customer/ICustomerRepository.js';

export class ProfileService implements IProfileService {
  constructor(private readonly customerRepository: ICustomerRepository) {}

  async getProfile(customerId: string): Promise<CustomerSchema> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) throw new CustomerNotFoundError();

    return customer;
  }

  async updateProfile(customerId: string, input: UpdateProfileInput): Promise<CustomerSchema> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) throw new CustomerNotFoundError();

    return await this.customerRepository.updateProfile(customerId, input);
  }

  async deleteAccount(customerId: string): Promise<void> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) throw new CustomerNotFoundError();

    await this.customerRepository.delete(customerId);
  }
}
