import { randomInt } from 'node:crypto';
import type { CustomerSchema, LoginInput, LoginResult, SignupInput, VerifyEmailInput } from '../../../domain/models/customer/Customer.js';
import type { ICustomerService } from '../../../domain/usecases/customer/ICustomerService.js';
import {
  EmailAlreadyRegisteredError,
  EmailAlreadyVerifiedError,
  CustomerNotFoundError,
  InvalidCredentialsError,
  InvalidVerificationCodeError,
  EmailNotVerifiedError,
  VerificationCodeExpiredError,
} from '../../../domain/errors/customer.js';
import type { IJwtService } from '../../domain/auth/IJwtService.js';
import type { ICustomerRepository } from '../../domain/customer/ICustomerRepository.js';
import type { IHasher } from '../../domain/customer/IHasher.js';
import type { IVerificationTokenRepository } from '../../domain/customer/IVerificationTokenRepository.js';
import type { IEmailService } from '../../domain/email/IEmailService.js';

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;

export class CustomerService implements ICustomerService {
  constructor(
    private readonly customerRepository: ICustomerRepository,
    private readonly hasher: IHasher,
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly emailService: IEmailService,
    private readonly jwtService: IJwtService,
  ) {}

  async signup(input: SignupInput): Promise<CustomerSchema> {
    const customerExists = await this.customerRepository.findByEmail(input.email);
    if (customerExists) throw new EmailAlreadyRegisteredError();

    const passwordHash = await this.hasher.hash(input.password);
    const customer = await this.customerRepository.insert({ email: input.email, passwordHash });

    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
    await this.verificationTokenRepository.insert(customer.id, code, expiresAt);

    await this.emailService.send(
      input.email,
      'Verify your email',
      `<p>Your verification code is <strong>${code}</strong>. It expires in ${VERIFICATION_CODE_EXPIRY_MINUTES} minutes.</p>`,
    );

    return customer;
  }

  async verifyEmail(input: VerifyEmailInput): Promise<CustomerSchema> {
    const customer = await this.customerRepository.findByEmail(input.email);
    if (!customer) throw new CustomerNotFoundError();

    if (customer.verifiedAt) throw new EmailAlreadyVerifiedError();

    const token = await this.verificationTokenRepository.find(customer.id, input.code);
    if (!token) throw new InvalidVerificationCodeError();

    if (token.expiresAt < new Date()) {
      await this.verificationTokenRepository.delete(token.id);
      throw new VerificationCodeExpiredError();
    }

    await this.verificationTokenRepository.delete(token.id);
    return await this.customerRepository.markVerified(customer.id);
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const customer = await this.customerRepository.findByEmailWithPassword(input.email);
    if (!customer) throw new InvalidCredentialsError();

    const passwordMatch = await this.hasher.compare(input.password, customer.passwordHash);
    if (!passwordMatch) throw new InvalidCredentialsError();

    if (!customer.verifiedAt) throw new EmailNotVerifiedError();

    const accessToken = await this.jwtService.sign({ sub: customer.id, email: customer.email });
    return { accessToken };
  }
}
