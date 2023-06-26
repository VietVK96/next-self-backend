import { Injectable } from '@nestjs/common';
import { ContactEntity } from 'src/entities/contact.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class ContactService {
  constructor(private dataSource: DataSource) {}

  async verifyByIdAndGroupId(id: number, orgId: number): Promise<boolean> {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `COUNT(CON_ID) as countId`;
    const qr = queryBuiler
      .select(select)
      .from(ContactEntity, 'CON')
      .where('CON.CON_ID = :id', {
        id,
      })
      .andWhere('CON.organization_id = :orgId', {
        orgId,
      });

    const { countId }: { countId: number } = await qr.getRawOne();
    return countId > 0;
  }
}
