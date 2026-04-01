import type { CustomerSchema, SignupInput } from '../../../domain/models/customer/Customer.js';
import type { ICustomerService } from '../../../domain/usecases/customer/ICustomerService.js';
import { BaseError } from '../../../shared/error.js';
import type { ICustomerRepository } from '../../domain/customer/ICustomerRepository.js';
import type { IHasher } from '../../domain/customer/IHasher.js';

export class CustomerService implements ICustomerService {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly hasher: IHasher,
  ) {}

  async signup(input: SignupInput): Promise<CustomerSchema> {
    const customerExists = await this.customerRepository.findByEmail(input.email);

    if (customerExists) throw new BaseError('Email already registered', 400);

    const passwordHash = await this.hasher.hash(input.password);

    return await this.customerRepository.insert({ email: input.email, passwordHash });
  }
}
