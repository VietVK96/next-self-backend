import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FindAllStructDto, IdStructDto } from '../dto/plan.dto';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { PermissionService } from 'src/users/services/permission.service';
import { PaymentPlanService } from 'src/payment-plan/services/payment-plan.service';
import {
  EventData,
  PlanEvent,
  TaskData,
  findOnePlanRes,
} from '../response/plan.res';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';

@Injectable()
export class PlanService {
  constructor(
    private permissionService: PermissionService,
    private paymentPlanService: PaymentPlanService,
    private dataSource: DataSource,
  ) {}

  async _getPlan(id: number, groupId: number): Promise<findOnePlanRes> {
    let plan: findOnePlanRes = null;
    const planQuery = `
    SELECT
        T_PLAN_PLF.PLF_ID AS id,
        T_PLAN_PLF.user_id,
        T_PLAN_PLF.patient_id,
        T_PLAN_PLF.payment_schedule_id,
        T_PLAN_PLF.PLF_NAME AS name,
        T_PLAN_PLF.PLF_TYPE AS type,
        T_PLAN_PLF.PLF_AMOUNT AS amount,
        T_PLAN_PLF.PLF_MUTUAL_CEILING AS mutualCeiling,
        T_PLAN_PLF.PLF_PERSON_REPAYMENT AS amount_repaid,
        T_PLAN_PLF.PLF_PERSON_AMOUNT AS amount_to_be_paid,
        IF (UNIX_TIMESTAMP(T_PLAN_PLF.PLF_ACCEPTED_ON) = 0, NULL, T_PLAN_PLF.PLF_ACCEPTED_ON) AS acceptedOn,
        T_PLAN_PLF.BIL_ID AS bill_id,
        T_DENTAL_QUOTATION_DQO.DQO_ID AS quote_id,
        T_DENTAL_QUOTATION_DQO.DQO_TYPE AS quote_template
    FROM T_PLAN_PLF
    LEFT OUTER JOIN T_DENTAL_QUOTATION_DQO ON T_DENTAL_QUOTATION_DQO.PLF_ID = T_PLAN_PLF.PLF_ID 
    WHERE T_PLAN_PLF.PLF_ID = ?
    GROUP BY T_PLAN_PLF.PLF_ID`;
    const plans: findOnePlanRes[] = await this.dataSource.query(planQuery, [
      id,
    ]);
    plan = plans[0];
    if (plan) {
      plan.displayBill = false;
      plan.bill = null;
      plan.quotation = null;
      if (plan.quote_id) {
        const quoteId = plan.quote_id;
        const quoteTemplate = plan.quote_template;

        plan.quotation = {
          id: quoteId,
          template: quoteTemplate,
          link: {
            print: quoteId,
            email: quoteId,
          },
        };
      }

      if (plan.bill_id) {
        plan.bill = {
          id: plan.bill_id,
        };
      }

      plan.payment_schedule = null;
      if (plan.payment_schedule_id) {
        plan.payment_schedule = await this.paymentPlanService.find(
          plan.payment_schedule_id,
          groupId,
        );
      }

      plan.bill_id = null;
      plan.quote_id = null;
      plan.quote_template = null;
      plan.payment_schedule_id = null;

      const eventStatement = `
      SELECT
        PLV.PLV_POS as plv_pos,
        PLV.duration as plv_duration,
        PLV.PLV_DELAY as plv_delay,
        EVT.EVT_ID as id,
        EVT.EVT_NAME as name,
        EVT.EVT_COLOR as color,
        IF (EVT.EVT_START IS NULL, NULL, CONCAT_WS(' ', evo.evo_date, TIME(EVT.EVT_START))) AS start,
        IF (EVT.EVT_END IS NULL, NULL, CONCAT_WS(' ', evo.evo_date, TIME(EVT.EVT_END))) AS end,
        USR.USR_ID as usr_id,
        CONCAT_WS(' ', USR.USR_LASTNAME, USR.USR_FIRSTNAME) as usr_display_name,
        event_type.id AS event_type_id,
        event_type.label AS event_type_label
      FROM T_PLAN_EVENT_PLV PLV
      JOIN T_EVENT_EVT EVT
      JOIN event_occurrence_evo evo
      LEFT OUTER JOIN T_USER_USR USR ON USR.USR_ID = EVT.USR_ID
      LEFT JOIN event_type ON event_type.id = EVT.event_type_id
      WHERE PLV.PLF_ID = ?
        AND PLV.EVT_ID = EVT.EVT_ID
        AND EVT.EVT_DELETE = 0
        AND evo.evt_id = EVT.EVT_ID
      ORDER BY plv_pos`;
      const event: EventData[] = await this.dataSource.query(eventStatement, [
        plan.id,
      ]);

      if (event) {
        for (const e of event) {
          const push: PlanEvent = {
            id: e.id,
            name: e.name,
            color: e.color,
            start: e.start,
            end: e.end,
            tasks: [],
            user:
              e.usr_id === null
                ? null
                : {
                    id: e.usr_id,
                    displayName: e.usr_display_name,
                  },
            plan: {
              pos: e.plv_pos,
              duration: e.plv_duration,
              delay: e.plv_delay,
            },
            event_type: e.event_type_id
              ? null
              : {
                  id: e.event_type_id,
                  label: e.event_type_label,
                },
          };

          const actStatement = `
              SELECT
                ETK.ETK_ID as id,
                ETK.library_act_id,
                ETK.library_act_quantity_id,
                ETK.parent_id,
                ETK.ETK_NAME as name,
                ETK.ETK_POS as pos,
                ETK.ETK_DURATION as duration,
                ETK.ETK_AMOUNT as amount,
                ETK.ETK_COLOR as color,
                ETK.ETK_QTY as qty,
                ETK.ETK_STATE as state,
                ETK.ccam_family,
                DET.ETK_ID as dental_id,
                DET.ccam_id,
                DET.ngap_key_id,
                DET.dental_material_id,
                DET.DET_TOOTH as dental_teeth,
                DET.DET_TYPE as dental_type,
                DET.DET_COEF as dental_coef,
                DET.DET_EXCEEDING as dental_exceeding,
                DET.exceptional_refund,
                DET.DET_CODE as dental_code,
                DET.DET_COMP as dental_comp,
                DET.DET_PURCHASE_PRICE as dental_purchase_price,
                DET.DET_CCAM_CODE as ccamCode,
                DET.DET_CCAM_OPPOSABLE as ccamOpposable,
                DET.DET_CCAM_NPC as ccamNPC,
                DET.DET_CCAM_NR as ccamNR,
                DET.DET_CCAM_TELEM as ccamTelem,
                DET.DET_CCAM_MODIFIER as ccamModifier,
                DET.DET_SECU_AMOUNT as secuAmount,
                DET.DET_SECU_REPAYMENT as secuRepayment,
                DET.DET_MUTUAL_REPAYMENT_TYPE as mutualRepaymentType,
                DET.DET_MUTUAL_REPAYMENT_RATE as mutualRepaymentRate,
                DET.DET_MUTUAL_REPAYMENT as mutualRepayment,
                DET.DET_MUTUAL_COMPLEMENT as mutualComplement,
                DET.DET_PERSON_REPAYMENT as personRepayment,
                DET.DET_PERSON_AMOUNT as personAmount,
                ccam_panier.id AS ccam_panier_id,
                ccam_panier.code AS ccam_panier_code,
                ccam_panier.label AS ccam_panier_label,
                ccam_panier.color AS ccam_panier_color
            FROM T_EVENT_TASK_ETK ETK
            LEFT OUTER JOIN T_DENTAL_EVENT_TASK_DET DET ON DET.ETK_ID = ETK.ETK_ID
            LEFT OUTER JOIN ccam ON ccam.id = DET.ccam_id
            LEFT OUTER JOIN ccam_family ON ccam_family.id = ccam.ccam_family_id
            LEFT OUTER JOIN ccam_panier ON ccam_panier.id = ccam_family.ccam_panier_id
            WHERE ETK.EVT_ID = ?
            GROUP BY ETK.ETK_ID
            ORDER BY ETK.ETK_POS`;

          const task: TaskData[] = await this.dataSource.query(actStatement, [
            push.id,
          ]);

          if (task) {
            for (const t of task) {
              push.tasks.push({
                id: t.id,
                library_act_id: t.library_act_id,
                library_act_quantity_id: t.library_act_quantity_id,
                parent_id: t.parent_id,
                name: t.name,
                pos: t.pos,
                duration: t.duration,
                amount: t.amount,
                color: t.color,
                qty: t.qty,
                state: t.state,
                ccam_family: t.ccam_family,
                dental:
                  t.dental_id === null
                    ? null
                    : {
                        teeth:
                          t.dental_teeth === null
                            ? []
                            : t.dental_teeth.split(','),
                        type: t.dental_type,
                        coef: t.dental_coef,
                        exceeding: t.dental_exceeding,
                        exceptional_refund: t.exceptional_refund,
                        code: t.dental_code,
                        comp: t.dental_comp,
                        purchasePrice: t.dental_purchase_price,
                        ccam_id: t.ccam_id,
                        ngap_key_id: t.ngap_key_id,
                        dental_material_id: t.dental_material_id,

                        ccamCode: t.ccamCode,
                        ccamOpposable: t.ccamOpposable,
                        ccamNPC: t.ccamNPC,
                        ccamNR: t.ccamNR,
                        ccamTelem: t.ccamTelem,
                        ccamModifier: t.ccamModifier,

                        secuAmount: t.secuAmount,
                        secuRepayment: t.secuRepayment,
                        mutualRepaymentType: t.mutualRepaymentType,
                        mutualRepaymentRate: t.mutualRepaymentRate,
                        mutualRepayment: t.mutualRepayment,
                        mutualComplement: t.mutualComplement,
                        personRepayment: t.personRepayment,
                        personAmount: t.personAmount,
                        ccam: !t.ccam_panier_id
                          ? {}
                          : {
                              family: {
                                panier: {
                                  id: t.ccam_panier_id,
                                  code: t.ccam_panier_code,
                                  label: t.ccam_panier_label,
                                  color: JSON.parse(t.ccam_panier_color),
                                },
                              },
                            },
                      },
              });

              if (t.state > 0) {
                plan.displayBill = true;
              }
            }

            plan.events = push;
          }
        }
      }
    } else {
      throw new CBadRequestException('unknown plan');
    }

    return plan;
  }

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

  async deleteOne(request: IdStructDto, identity: UserIdentity) {
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

  async findOne(request: IdStructDto, organizationId: number) {
    try {
      const planificationId = request.id;
      const planification = await this._getPlan(
        planificationId,
        organizationId,
      );

      //@TODO
      // const planificationType = planification.type;
      // if ($planificationType == 'plan') {
      //   Ids\Log:: write('Plan de traitement', $planification['patient_id'], 0);
      // } else if ($planificationType == 'quotation') {
      //   Ids\Log:: write('Devis', $planification['patient_id'], 0);
      // }
      // return JSON.stringify(planification)
      return planification;
    } catch (error) {
      return error;
    }
  }
}
