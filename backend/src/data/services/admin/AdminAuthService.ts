import { randomInt } from 'node:crypto';
import {
  AdminInvalidCredentialsError,
  AdminNotFoundError,
  AdminPasswordNotSetError,
} from '../../../domain/errors/admin.js';
import {
  InvalidVerificationCodeError,
  VerificationCodeExpiredError,
} from '../../../domain/errors/customer.js';
import type {
  AdminLoginInput,
  AdminLoginResult,
  AdminRequestPasswordResetInput,
  AdminResetPasswordInput,
} from '../../../domain/models/admin/Admin.js';
import { AdminTokenType } from '../../../domain/models/admin/Admin.js';
import type { IAdminAuthService } from '../../../domain/usecases/admin/IAdminAuthService.js';
import type { IAdminRepository } from '../../domain/admin/IAdminRepository.js';
import type { IAdminTokenRepository } from '../../domain/admin/IAdminTokenRepository.js';
import type { IJwtService } from '../../domain/auth/IJwtService.js';
import type { IHasher } from '../../domain/customer/IHasher.js';
import type { IEmailService } from '../../domain/email/IEmailService.js';

const RESET_CODE_EXPIRY_MINUTES = 15;

export class AdminAuthService implements IAdminAuthService {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly hasher: IHasher,
    private readonly adminTokenRepository: IAdminTokenRepository,
    private readonly emailService: IEmailService,
    private readonly jwtService: IJwtService,
  ) {}

  async login(input: AdminLoginInput): Promise<AdminLoginResult> {
    const admin = await this.adminRepository.findByEmailWithPassword(input.email);
    if (!admin) throw new AdminInvalidCredentialsError();
    if (!admin.passwordHash) throw new AdminPasswordNotSetError();

    const passwordMatch = await this.hasher.compare(input.password, admin.passwordHash);
    if (!passwordMatch) throw new AdminInvalidCredentialsError();

    const accessToken = await this.jwtService.sign({ sub: admin.id, email: admin.email });
    return {
      accessToken,
      profile: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        createdAt: admin.createdAt,
      },
    };
  }

  async requestPasswordReset(input: AdminRequestPasswordResetInput): Promise<void> {
    const admin = await this.adminRepository.findByEmail(input.email);
    if (!admin) return;

    await this.adminTokenRepository.deleteByAdminAndType(admin.id, AdminTokenType.PASSWORD_RESET);

    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + RESET_CODE_EXPIRY_MINUTES * 60 * 1000);
    await this.adminTokenRepository.insert(
      admin.id,
      code,
      AdminTokenType.PASSWORD_RESET,
      expiresAt,
    );

    await this.emailService.send(
      input.email,
      'Admin password reset',
      `<p>Your admin password reset code is <strong>${code}</strong>. It expires in ${RESET_CODE_EXPIRY_MINUTES} minutes.</p>`,
    );
  }

  async resetPassword(input: AdminResetPasswordInput): Promise<void> {
    const admin = await this.adminRepository.findByEmail(input.email);
    if (!admin) throw new AdminNotFoundError();

    const token = await this.adminTokenRepository.find(
      admin.id,
      input.code,
      AdminTokenType.PASSWORD_RESET,
    );
    if (!token) throw new InvalidVerificationCodeError();

    if (token.expiresAt < new Date()) {
      await this.adminTokenRepository.delete(token.id);
      throw new VerificationCodeExpiredError();
    }

    const passwordHash = await this.hasher.hash(input.newPassword);
    await this.adminRepository.updatePassword(admin.id, passwordHash);
    await this.adminTokenRepository.delete(token.id);
  }
}
