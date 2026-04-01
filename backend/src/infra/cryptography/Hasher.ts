import * as bcrypt from 'bcryptjs';
import type { IHasher } from '../../data/domain/customer/IHasher.js';

export class Hasher implements IHasher {
  constructor(private readonly salt: number) {}

  async hash(value: string): Promise<string> {
    return await bcrypt.hash(value, this.salt);
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(value, hash);
  }
}
