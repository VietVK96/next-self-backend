import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TrashContactService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(groupId?: number, start?: number, length?: number) {
    const startPage = (start - 1) * length;
    const totalData = await this.dataSource.query(
      ` SELECT SQL_CALC_FOUND_ROWS
        CON.CON_ID id,
        CON.CON_NBR nbr,
        CON.CON_LASTNAME lastname,
        CON.CON_FIRSTNAME firstname,
        USR.USR_ID practitionerId,
        USR.USR_ABBR practitionerAbbr,
        USR.USR_LASTNAME practitionerLastname,
        USR.USR_FIRSTNAME practitionerFirstname
    FROM T_CONTACT_CON CON
    LEFT OUTER JOIN T_USER_USR USR ON USR.USR_ID = CON.USR_ID
    WHERE CON.organization_id = ?
      AND CON.deleted_at IS NOT NULL
    ORDER BY lastname, firstname, nbr`,
      [groupId],
    );

    const offSet = (start - 1) * length;
    const results = totalData.slice(offSet, offSet + length);

    return {
      data: results,
      pageIndex: start,
      pageData: results.length,
      totalData: totalData.length,
    };
  }
}
