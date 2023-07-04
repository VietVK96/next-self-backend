import { Injectable } from '@nestjs/common';
import { AddressEntity } from 'src/entities/address.entity';
import { DataSource } from 'typeorm';
@Injectable()
export class AddressService {
  constructor(private dataSource: DataSource) {}
  async find(id: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
  ADR.ADR_ID AS id,
  ADR.ADR_STREET AS street,
  ADR.ADR_STREET_COMP AS street_comp,
  ADR.ADR_ZIP_CODE AS zip_code,
  ADR.ADR_CITY AS city,
  ADR.ADR_COUNTRY AS country,
  ADR.ADR_COUNTRY_ABBR AS country_code
  `;
    const q = queryBuiler
      .select(select)
      .from(AddressEntity, 'ADR')
      .where('ADR.ADR_ID = :id', { id });
    return await q.getRawOne();
  }
}
