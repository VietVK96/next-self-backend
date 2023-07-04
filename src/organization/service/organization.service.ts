/**
 * Repositories/Group.php
 */
import { Injectable } from '@nestjs/common';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class OrganizationService {
  constructor(private dataSource: DataSource) {}

  async hasStorageSpace(groupId: number, size?: number): Promise<boolean> {
    const queryBuilder = this.dataSource.createQueryBuilder();
    queryBuilder
      .select('GRP.totalStorageSpace - GRP.storageSpaceUsed', 'remainingSpace')
      .from(OrganizationEntity, 'GRP')
      .where('GRP.id = :groupId', { groupId });

    const result = await queryBuilder.getRawOne();
    const remainingSpace = result?.remainingSpace ?? 0;

    if (typeof size === 'number') {
      return remainingSpace - size > 0;
    }

    return remainingSpace > 0;
  }

  async getStorageSpace(
    groupId: number,
  ): Promise<{ totalStorageSpace: number; storageSpaceUsed: number }> {
    const queryBuilder = this.dataSource.createQueryBuilder();
    return queryBuilder
      .select('GRP.totalStorageSpace', 'totalStorageSpace')
      .addSelect('GRP.storageSpaceUsed', 'storageSpaceUsed')
      .from(OrganizationEntity, 'GRP')
      .where('GRP.id = :groupId', { groupId })
      .getRawOne();
  }
}
