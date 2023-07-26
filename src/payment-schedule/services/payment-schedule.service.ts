import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PaymentItemRes } from '../response/payment.res';
import { PaymentSchedulesDto } from '../dto/payment.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';

@Injectable()
export class PaymentScheduleService {
  constructor(private dataSource: DataSource) {}

  /**
   * File: application/Services/PaymentSchedule.php, Line 82-124
   * @function main function
   *
   */

  //File /application/Services/PaymentSchedule.php, line 82-126
  async find(paymentScheduleId: number, groupId: number) {
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
    paymentSchedule.lines = await qrLine.getRawMany();

    return paymentSchedule;
  }

  //File /application/Services/PaymentSchedule.php, line 219-240
  async delete(id: number, groupId: number) {
    const queryBuiler = this.dataSource.createQueryBuilder();
    const paymentSchedule = this.find(id, groupId);

    queryBuiler
      .delete()
      .from('payment_schedule')
      .where('id = :id', { id })
      .andWhere('group_id = :groupId', { groupId })
      .execute();

    //@TODO
    // if (!$statement -> rowCount()) {
    //   throw new InvalidArgumentException(trans("validation.in", [
    //     '%attribute%' => 'id'
    //   ]));
    // }

    return paymentSchedule;
  }

  // application/Services/PaymentSchedule.php 18->72
  async store(payload: PaymentSchedulesDto, identity: UserIdentity) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const q = `INSERT INTO payment_schedule (group_id, doctor_id, patient_id, label, amount, observation)
      VALUES (?, ?, ?, ?, ?, ?)`;

      const paymentSchedule = await queryRunner.query(q, [
        identity.org,
        payload?.doctor_id,
        payload?.patient_id,
        payload?.label || '',
        payload?.amount || 0,
        payload?.observation || null,
      ]);

      const q2 = `INSERT INTO payment_schedule_line (payment_schedule_id, date, amount)
      VALUES (?, ?, ?)`;

      Promise.all(
        payload?.lines?.map(async (line) => {
          await queryRunner.query(q2, [
            paymentSchedule.insertId,
            line.date,
            line.amount,
          ]);
        }),
      );
      await queryRunner.commitTransaction();
      return this.find(paymentSchedule.insertId, identity.org);
    } catch (err) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async duplicate(id: number, identity: UserIdentity) {
    const paymentSchedule = await this.find(id, identity.org);
    return await this.store(paymentSchedule as PaymentSchedulesDto, identity);
  }
}
