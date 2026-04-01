import type { Pool } from 'pg';
import type { IInstitutionRepository } from '../../../data/domain/institution/IInstitutionRepository.js';
import type { InstitutionSchema } from '../../../domain/models/institution/Institution.js';

type InstitutionRow = {
  id: string;
  name: string;
  country_code: string | null;
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
}
