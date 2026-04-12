import { AdminEmailConflictError, AdminNotFoundError } from '../../../domain/errors/admin.js';
import type { AdminSchema, CreateAdminInput } from '../../../domain/models/admin/Admin.js';
import type { IAdminManagementService } from '../../../domain/usecases/admin/IAdminManagementService.js';
import type { IAdminRepository } from '../../domain/admin/IAdminRepository.js';
import type { IHasher } from '../../domain/customer/IHasher.js';

export class AdminManagementService implements IAdminManagementService {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly hasher: IHasher,
  ) {}

  async listAdmins(): Promise<AdminSchema[]> {
    return await this.adminRepository.findAll();
  }

  async createAdmin(input: CreateAdminInput): Promise<AdminSchema> {
    const existing = await this.adminRepository.findByEmail(input.email);
    if (existing) throw new AdminEmailConflictError();

    const passwordHash = await this.hasher.hash(input.password);
    return await this.adminRepository.insert({
      email: input.email,
      passwordHash,
      name: input.name,
    });
  }

  async deleteAdmin(id: string): Promise<void> {
    const admin = await this.adminRepository.findById(id);
    if (!admin) throw new AdminNotFoundError();
    await this.adminRepository.deleteById(id);
  }
}
