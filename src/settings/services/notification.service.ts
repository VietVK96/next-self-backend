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
    const sendingLog = this.dataSource.query(query, [userID]);
    return sendingLog;
  }
}
