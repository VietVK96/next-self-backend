import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindAllStructDto } from '../dto/plan.dto';
import { PaymentPlanService } from 'src/payment-plan/services/payment-plan.service';

@Injectable()
export class PlanService {
  constructor(
    private paymentPlanService: PaymentPlanService,
    private dataSource: DataSource,
  ) {}

  /**
   * File: php\contact\plans\findAll.php, line 23->94
   * @function main function
   *
   */

  async findAll(request: FindAllStructDto) {
    const { type, patientId } = request;

    const plansResult = [];

    const queryBuiler = this.dataSource.createQueryBuilder();
    const select = `
      T_PLAN_PLF.PLF_ID AS id,
      T_EVENT_EVT.USR_ID AS doctor_id,
      T_PLAN_PLF.payment_schedule_id AS payment_schedule_id,
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

    const doctorIds = plans.map((plan) => plan.doctor_id);

    if (doctorIds && doctorIds.length > 0) {
      const selectDoctor = `
        T_USER_USR.USR_ID AS id,
        T_USER_USR.organization_id AS group_id,
        T_USER_USR.USR_LASTNAME AS lastname,
        T_USER_USR.USR_FIRSTNAME AS firstname
      `;
      const qrDoctor = queryBuiler
        .select(selectDoctor)
        .from('T_USER_USR', 'T_USER_USR')
        .where('T_USER_USR.USR_ID IN (:...doctorIds)', {
          doctorIds,
        })
        .groupBy('T_USER_USR.USR_ID');
      const doctors = await qrDoctor.getRawMany();

      const length = plans.length;
      for (let index = 0; index < length; index++) {
        const doctor = doctors.find((x) => x.id === plans[index].doctor_id);

        plans[index].doctor = doctor;
        delete plans[index]['doctor_id'];

        try {
          // Récupération de l'échéancier
          const paymentSchedule = await this.paymentPlanService
            .find(plans[index].payment_schedule_id, doctor['group_id'])
            .then((res) => res);

          plans[index].payment_schedule = paymentSchedule;
        } catch (error) {
          plans[index].payment_schedule = null;
        } finally {
          delete plans[index].payment_schedule_id;
        }

        plansResult.push(plans[index]);
      }
    }

    return plansResult;
  }
}
