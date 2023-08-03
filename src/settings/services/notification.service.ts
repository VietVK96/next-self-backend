import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(private dataSource: DataSource) {}

  async getNotificationHistorical(userID: number) {
    const query = `
    SELECT *
        FROM T_USER_SMS_HISTORY_USH sendingLog
        WHERE sendingLog.USR_ID = ?
        ORDER BY sendingLog.USH_USED DESC
        `;
    const sendingLog = await this.dataSource.query(query, [userID]);
    const res = [];

    for (let i = 0; i < sendingLog.length; i++) {
      const resItem = {
        id: sendingLog.length > 0 && sendingLog[i].USH_ID,
        userId: sendingLog.length > 0 && sendingLog[i].USR_ID,
        sendingDate: sendingLog.length > 0 && sendingLog[i].USH_USED,
        message: sendingLog.length > 0 && sendingLog[i].USH_MSG,
        externalReferenceId: sendingLog.length > 0 && sendingLog[i].USH_OVH_ID,
        createdAt: sendingLog.length > 0 && sendingLog[i].created_at,
        updatedAt: sendingLog.length > 0 && sendingLog[i].updated_at,
      };
      res.push(resItem);
    }

    return res;
  }
}
