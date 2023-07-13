/**
 * Repositories/Group.php
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class BankService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(OrganizationEntity)
    private organizationRepo: Repository<OrganizationEntity>,
  ) {}

  async findAllBank(groupId: number, practitionerId: number) {
    const records = await this.dataSource.query(
      `SELECT
      LBK.LBK_ID id,
      LBK.LBK_ABBR abbr,
      LBK.LBK_NAME name,
      LBK.LBK_BANK_CODE bankCode,
      LBK.LBK_BRANCH_CODE branchCode,
      LBK.LBK_ACCOUNT_NBR accountNbr,
      LBK.LBK_BANK_DETAILS bankDetails,
      LBK.LBK_CURRENCY currency,
      LBK.LBK_SLIP_CHECK_NBR slipCheckNbr,
      LBK.LBK_POS pos,
      USR.USR_ID practitionerId,
      USR.USR_ABBR practitionerAbbr,
      USR.USR_LASTNAME practitionerLastname,
      USR.USR_FIRSTNAME practitionerFirstname,
      ADR.ADR_ID addressId,
      ADR.ADR_STREET addressStreet,
      ADR.ADR_STREET_COMP addressStreetComp,
      ADR.ADR_ZIP_CODE addressZipCode,
      ADR.ADR_CITY addressCity
    FROM T_LIBRARY_BANK_LBK LBK
    LEFT OUTER JOIN T_USER_USR USR ON USR.USR_ID = LBK.USR_ID
    LEFT OUTER JOIN T_ADDRESS_ADR ADR ON ADR.ADR_ID = LBK.ADR_ID
    WHERE LBK.organization_id = ?
      AND LBK.deleted_at IS NULL
      AND (LBK.USR_ID IS NULL OR LBK.USR_ID = ?)
    ORDER BY LBK.LBK_POS, LBK.LBK_ABBR`,
      [groupId, practitionerId],
    );
    return records;
  }

  async bankChecks(organizationId: number) {
    const organization = await this.organizationRepo.findOne({
      where: { id: organizationId },
      relations: {
        bankChecks: true,
      },
    });

    return organization.bankChecks.map(({ id, name, position }) => ({
      id,
      name,
      position,
    }));
  }
}
