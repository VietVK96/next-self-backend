import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindAllStructDto } from '../dto/plan.dto';

@Injectable()
export class PlanService {
  constructor(private dataSource: DataSource) {}

  /**
   * File: php\contact\plans\findAll.php
   * @function main function
   *
   */

  async findAll(request: FindAllStructDto, organizationId: number) {
    const { type, patientId } = request;
    console.log(request);

    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      T_PLAN_PLF.PLF_ID AS id,
      T_EVENT_EVT.USR_ID AS doctor_id,
      T_PLAN_PLF.payment_schedule_id,
      T_PLAN_PLF.PLF_NAME AS name,
      T_PLAN_PLF.PLF_AMOUNT AS amount,
      T_PLAN_PLF.created_at,
      T_PLAN_PLF.updated_at,
      IF (UNIX_TIMESTAMP(T_PLAN_PLF.PLF_ACCEPTED_ON) = 0, NULL, T_PLAN_PLF.PLF_ACCEPTED_ON) AS accepted_at,
              sent_to_patient,
              sending_date_to_patient
    `;
    const qr = queryBuiler
      .select(select)
      .from('T_PLAN_PLF', 'T_PLAN_PLF')
      .innerJoin('T_PLAN_EVENT_PLV', 'T_PLAN_EVENT_PLV')
      .innerJoin('T_EVENT_EVT', 'T_EVENT_EVT')
      .where('T_PLAN_PLF.PLF_TYPE = :type', { type: type })
      .andWhere('T_PLAN_PLF.PLF_ID = T_PLAN_EVENT_PLV.PLF_ID')
      .andWhere('T_PLAN_EVENT_PLV.EVT_ID = T_EVENT_EVT.EVT_ID')
      .andWhere('T_EVENT_EVT.CON_ID = :patientId', { patientId: patientId })
      .groupBy('T_PLAN_PLF.PLF_ID')
      .orderBy('T_PLAN_PLF.updated_at', 'DESC');

    const plans = await qr.getRawMany();

    const selectDoctor = `
      T_USER_USR.USR_ID AS id,
      T_USER_USR.organization_id AS group_id,
      T_USER_USR.USR_LASTNAME AS lastname,
      T_USER_USR.USR_FIRSTNAME AS firstname
    `;
    const qrDoctor = queryBuiler
      .select(selectDoctor)
      .from('T_USER_USR', 'T_USER_USR')
      .where('T_USER_USR.USR_ID = :doctorId');
    plans.forEach((plan) => {
      qrDoctor.setParameter('doctorId', plan.doctor_id);
      const doctor = qrDoctor.getRawOne();

      plan['doctor'] = doctor;
      delete plan['doctor_id'];
    });

    return plans;
  }
}
