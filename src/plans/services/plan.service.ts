import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DeleteOneStructDto, FindAllStructDto } from '../dto/plan.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { PermissionService } from 'src/users/services/permission.service';
import { PaymentPlanService } from 'src/payment-plan/services/payment-plan.service';

@Injectable()
export class PlanService {
  constructor(
    private permissionService: PermissionService,
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

  async deleteOne(request: DeleteOneStructDto, identity: UserIdentity) {
    const { id } = request;
    const queryRunner = this.dataSource.createQueryRunner();
    const queryBuiler = this.dataSource.createQueryBuilder();
    try {
      const selectPlan = `
        T_PLAN_PLF.PLF_TYPE AS type,
        T_PLAN_PLF.payment_schedule_id,
        T_EVENT_EVT.CON_ID AS patient_id`;

      const statement = queryBuiler
        .select(selectPlan)
        .from('T_PLAN_PLF', 'T_PLAN_PLF')
        .innerJoin('T_PLAN_EVENT_PLV', 'T_PLAN_EVENT_PLV')
        .innerJoin('T_EVENT_EVT', 'T_EVENT_EVT')
        .where('T_PLAN_PLF.PLF_ID = :planId', { planId: id })
        .andWhere('T_PLAN_PLF.PLF_ID = T_PLAN_EVENT_PLV.PLF_ID')
        .andWhere('T_PLAN_EVENT_PLV.EVT_ID = T_EVENT_EVT.EVT_ID')
        .groupBy('T_PLAN_PLF.PLF_ID');
      const plan = await statement.getRawOne();

      if (!plan) {
        throw new NotFoundException();
      }

      if (
        !this.permissionService.hasPermission(
          'PERMISSION_DELETE',
          8,
          identity.id,
        )
      ) {
        throw new NotAcceptableException();
      }

      await queryRunner.startTransaction();

      if (plan.payment_schedule_id !== null) {
        await this.paymentPlanService.delete(
          plan.payment_schedule_id,
          identity.org,
        );
      }

      const dentalQuery = this.dataSource
        .createQueryBuilder()
        .delete()
        .from('T_DENTAL_QUOTATION_DQO')
        .where(`PLF_ID = ${id}`);
      await queryRunner.query(dentalQuery.getSql());

      const invoiceQuery = this.dataSource
        .createQueryBuilder()
        .select()
        .from('T_PLAN_PLF', 'T_PLAN_PLF')
        .where(`T_PLAN_PLF.PLF_ID = ${id}`);
      const invoice = await queryRunner.query(invoiceQuery.getSql());

      if (invoice.BIL_ID) {
        const updatePlanQuery = this.dataSource
          .createQueryBuilder()
          .update('T_PLAN_PLF')
          .set({ BIL_ID: null })
          .where(`PLF_ID = ${id}`);
        await queryRunner.query(updatePlanQuery.getSql());

        const deleteBillQuery = this.dataSource
          .createQueryBuilder()
          .delete()
          .from('T_BILL_BIL')
          .where(`BIL_ID = ${invoice.id}`)
          .andWhere('BIL_LOCK = 0');
        await queryRunner.query(deleteBillQuery.getSql());
      }

      const queryEvent = `
      DELETE T_EVENT_TASK_ETK
      FROM T_EVENT_TASK_ETK
      JOIN T_EVENT_EVT
      JOIN T_PLAN_EVENT_PLV
      JOIN T_PLAN_PLF
      WHERE T_EVENT_TASK_ETK.ETK_STATE = 0
        AND T_EVENT_TASK_ETK.EVT_ID = T_EVENT_EVT.EVT_ID
        AND T_EVENT_EVT.EVT_ID = T_PLAN_EVENT_PLV.EVT_ID
        AND T_PLAN_EVENT_PLV.PLF_ID = T_PLAN_PLF.PLF_ID
        AND T_PLAN_PLF.PLF_ID = ?`;
      await queryRunner.query(queryEvent, [id]);

      const queryReminder = `
        DELETE T_REMINDER_RMD
        FROM T_EVENT_EVT
        JOIN T_REMINDER_RMD
        JOIN T_PLAN_EVENT_PLV
        JOIN T_PLAN_PLF
        WHERE T_EVENT_EVT.EVT_ID = T_REMINDER_RMD.EVT_ID
          AND T_EVENT_EVT.EVT_ID = T_PLAN_EVENT_PLV.EVT_ID
          AND T_PLAN_EVENT_PLV.PLF_ID = T_PLAN_PLF.PLF_ID
          AND T_PLAN_PLF.PLF_ID = ?
          AND NOT EXISTS (
            SELECT *
            FROM T_EVENT_TASK_ETK
            WHERE T_EVENT_TASK_ETK.EVT_ID = T_EVENT_EVT.EVT_ID
        )`;
      await queryRunner.query(queryReminder, [id]);

      const queryEventOccurrenceEvo = `
      DELETE event_occurrence_evo
      FROM T_EVENT_EVT
      JOIN event_occurrence_evo
      JOIN T_PLAN_EVENT_PLV
      JOIN T_PLAN_PLF
      WHERE T_EVENT_EVT.EVT_ID = event_occurrence_evo.evt_id
        AND T_EVENT_EVT.EVT_ID = T_PLAN_EVENT_PLV.EVT_ID
        AND T_PLAN_EVENT_PLV.PLF_ID = T_PLAN_PLF.PLF_ID
        AND T_PLAN_PLF.PLF_ID = ?
        AND NOT EXISTS (
            SELECT *
              FROM T_EVENT_TASK_ETK
            WHERE T_EVENT_TASK_ETK.EVT_ID = T_EVENT_EVT.EVT_ID
        )`;
      await queryRunner.query(queryEventOccurrenceEvo, [id]);

      const queryEventEvt = `
      DELETE T_EVENT_EVT
      FROM T_EVENT_EVT
      JOIN T_PLAN_EVENT_PLV
      JOIN T_PLAN_PLF
      WHERE T_EVENT_EVT.EVT_ID = T_PLAN_EVENT_PLV.EVT_ID
        AND T_PLAN_EVENT_PLV.PLF_ID = T_PLAN_PLF.PLF_ID
        AND T_PLAN_PLF.PLF_ID = ?
        AND NOT EXISTS (
            SELECT *
              FROM T_EVENT_TASK_ETK
            WHERE T_EVENT_TASK_ETK.EVT_ID = T_EVENT_EVT.EVT_ID
        )`;
      await queryRunner.query(queryEventEvt, [id]);

      const deletePlanQuery = `
        DELETE FROM T_PLAN_PLF
        WHERE PLF_ID = ?`;
      await queryRunner.query(deletePlanQuery, [id]);

      await queryRunner.commitTransaction();

      //@TODO
      // switch ($plan['type']) {
      //   case 'plan':
      //     Ids\Log:: write('Plan de traitement', $plan['patient_id'], 3);
      //     break;
      //   case 'quotation':
      //     Ids\Log:: write('Devis', $plan['patient_id'], 3);
      //     break;
      // }

      return id;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      return error;
    }
  }
}
