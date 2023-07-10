import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TrashEventService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(doctorId?: number, start?: number, length?: number) {
    const totalData = await this.dataSource.query(
      ` SELECT SQL_CALC_FOUND_ROWS
        EVT.EVT_ID id,
        EVT.EVT_NAME name,
        DATE(EVT.EVT_START) date,
        CON.CON_ID contactId,
        CON.CON_NBR contactAbbr,
        CON.CON_LASTNAME contactLastname,
        CON.CON_FIRSTNAME contactFirstname
    FROM T_EVENT_EVT EVT
    LEFT OUTER JOIN T_CONTACT_CON CON ON CON.CON_ID = EVT.CON_ID
    WHERE EVT.USR_ID = ?
      AND EVT.EVT_DELETE = 1
    ORDER BY date DESC`,
      [doctorId],
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

  async restore(groupId: number, ids: number[]) {
    const query = `
      UPDATE T_EVENT_EVT EVT
      INNER JOIN T_USER_USR USR ON EVT.USR_ID = USR.USR_ID
      SET EVT.EVT_DELETE = 0
      WHERE EVT.EVT_ID IN (${ids.join(',')})
        AND USR.organization_id = ${groupId}
    `;
    await this.dataSource.query(query);
    return;
  }
}
