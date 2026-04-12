import type { Pool } from 'pg';
import type { IInstitutionRepository } from '../../../data/domain/institution/IInstitutionRepository.js';
import type {
  CreateInstitutionInput,
  InstitutionSchema,
  UpdateInstitutionInput,
} from '../../../domain/models/institution/Institution.js';

type InstitutionRow = {
  id: string;
  name: string;
  country_code: string;
  logo_url: string | null;
};

function toSchema(row: InstitutionRow): InstitutionSchema {
  return {
    id: row.id,
    name: row.name,
    countryCode: row.country_code,
    logoUrl: row.logo_url,
  };
}

export class InstitutionRepository implements IInstitutionRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<InstitutionSchema[]> {
    const result = await this.pool.query<InstitutionRow>(
      'SELECT id, name, country_code, logo_url FROM institutions ORDER BY name',
    );
    return result.rows.map(toSchema);
  }

  async findById(id: string): Promise<InstitutionSchema | null> {
    const result = await this.pool.query<InstitutionRow>(
      'SELECT id, name, country_code, logo_url FROM institutions WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? toSchema(row) : null;
  }

  async insert(input: CreateInstitutionInput): Promise<InstitutionSchema> {
    const result = await this.pool.query<InstitutionRow>(
      'INSERT INTO institutions (name, country_code, logo_url) VALUES ($1, $2, $3) RETURNING id, name, country_code, logo_url',
      [input.name, input.countryCode, input.logoUrl ?? null],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to insert institution');
    return toSchema(row);
  }

  async update(id: string, input: UpdateInstitutionInput): Promise<InstitutionSchema> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.countryCode !== undefined) {
      fields.push(`country_code = $${paramIndex++}`);
      values.push(input.countryCode);
    }
    if (input.logoUrl !== undefined) {
      fields.push(`logo_url = $${paramIndex++}`);
      values.push(input.logoUrl);
    }

    values.push(id);
    const result = await this.pool.query<InstitutionRow>(
      `UPDATE institutions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, country_code, logo_url`,
      values,
    );
    const row = result.rows[0];
    if (!row) throw new Error('Failed to update institution');
    return toSchema(row);
  }

  async deleteById(id: string): Promise<void> {
    await this.pool.query('DELETE FROM institutions WHERE id = $1', [id]);
  }
}
