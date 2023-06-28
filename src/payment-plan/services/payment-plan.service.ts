import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaymentItemRes } from '../response/payment.res';

@Injectable()
export class PaymentPlanService {
  constructor(private dataSource: DataSource) {}

  /**
   * File: application/Services/PaymentSchedule.php
   * @function main function
   *
   */

  async find(paymentScheduleId, groupId) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      id,
      doctor_id,
      patient_id,
      label,
      amount,
      observation
    `;
    const qr = queryBuiler
      .select(select)
      .from('payment_schedule', 'payment_schedule')
      .where('id = :paymentScheduleId', {
        paymentScheduleId: paymentScheduleId,
      })
      .andWhere('group_id = :groupId', { groupId: groupId });

    const paymentSchedule: PaymentItemRes = await qr.getRawOne();

    // resources/lang/messages.fr.xlf (Line: 1445->1448)
    // @TODO Translate message err
    if (!paymentSchedule) {
      throw new NotFoundException(`Le champ id est invalide.)}`);
    }

    const queryLine = this.dataSource.createQueryBuilder();
    const selectLine = `
      id,
      date,
      amount
    `;
    const qrLine = queryLine
      .select(selectLine)
      .from('payment_schedule_line', 'payment_schedule_line')
      .where('payment_schedule_id = :paymentScheduleId', {
        paymentScheduleId: paymentScheduleId,
      });

    if (paymentSchedule.lines) {
      paymentSchedule.lines = await qrLine.getRawOne();
    }

    return paymentSchedule;
  }
}
