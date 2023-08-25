import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { EventEntity } from 'src/entities/event.entity';
import { EnumPlanPlfType, PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { TraceabilityStatusEnum } from 'src/enum/traceability-status-enum';
import { PaymentScheduleService } from 'src/payment-schedule/services/payment-schedule.service';
import { PermissionService } from 'src/user/services/permission.service';
import { DataSource } from 'typeorm';
import {
  ActionSaveStructDto,
  BodySaveStructDto,
  DuplicatePlanDto,
  FindAllStructDto,
  IdStructDto,
} from '../dto/plan.dto';
import {
  EventData,
  PlanEvent,
  TaskData,
  findOnePlanRes,
} from '../response/plan.res';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';

@Injectable()
export class PlanService {
  constructor(
    private permissionService: PermissionService,
    private paymentPlanService: PaymentScheduleService,
    private dataSource: DataSource,
  ) {}

  private _empty(value: any) {
    switch (value) {
      case 0:
      case '0':
      case '':
      case null:
      case undefined:
      case false:
        return true;
      default:
        return false;
    }
  }

  //File /application/Services/Plan.php, line 103-367
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
    plan = plans?.[0];
    if (!this._empty(plan)) {
      plan.displayBill = false;
      plan.bill = null;
      plan.quotation = null;
      plan.events = [];
      if (!this._empty(plan.quote_id)) {
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

      if (!this._empty(plan.bill_id)) {
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

      const eventCurrentPlanPlfQuery = `
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
      const event: EventData[] = await this.dataSource.query(
        eventCurrentPlanPlfQuery,
        [plan.id],
      );

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
            event_type: !e.event_type_id
              ? null
              : {
                  id: e.event_type_id,
                  label: e.event_type_label,
                },
          };

          const actCurrentPlanPlfQuery = `
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

          const task: TaskData[] = await this.dataSource.query(
            actCurrentPlanPlfQuery,
            [push.id],
          );

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

            plan.events.push(push);
          }
        }
      }
    } else {
      throw new CBadRequestException('unknown plan');
    }

    return plan;
  }

  //File /application/Services/Plan.php, line 377-924
  async _save(data: any, groupId: number) {
    const events = [];
    const options = {
      id: 0,
      user_id: 0,
      patient_id: 0,
      payment_schedule: { id: null },
      type: 'plan',
      name: null,
      acceptedOn: null,
      amount: 0,
      mutualCeiling: 0,
      amount_repaid: 0,
      amount_to_be_paid: 0,
      events: [],
      ...data,
    };

    if (!(Array.isArray(options?.events) && options?.events.length > 0)) {
      throw new BadRequestException(
        'The treatment plan must have at least one event',
      );
    }

    if (this._empty(options?.patient_id)) {
      throw new BadRequestException();
    }

    return await this.dataSource.transaction(async (manager) => {
      try {
        if (this._empty(options?.acceptedOn) && options?.type === 'plan') {
          options.acceptedOn = Date.now();
        }

        const insertPlanQuery = `
          INSERT INTO T_PLAN_PLF (PLF_ID, organization_id, user_id, patient_id, payment_schedule_id, PLF_NAME, PLF_TYPE, PLF_ACCEPTED_ON, PLF_AMOUNT, PLF_MUTUAL_CEILING, PLF_PERSON_REPAYMENT, PLF_PERSON_AMOUNT) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          payment_schedule_id = VALUES(payment_schedule_id),
          PLF_NAME = VALUES(PLF_NAME),
          PLF_TYPE = VALUES(PLF_TYPE),
          PLF_ACCEPTED_ON = VALUES(PLF_ACCEPTED_ON),
          PLF_AMOUNT = VALUES(PLF_AMOUNT),
          PLF_MUTUAL_CEILING = VALUES(PLF_MUTUAL_CEILING),
          PLF_PERSON_REPAYMENT = VALUES(PLF_PERSON_REPAYMENT),
          PLF_PERSON_AMOUNT = VALUES(PLF_PERSON_AMOUNT)`;

        const planNew = await manager.query(insertPlanQuery, [
          options.id,
          groupId,
          options?.user_id,
          options?.patient_id,
          options?.payment_schedule?.id ?? null,
          options?.name,
          options?.type,
          options?.acceptedOn,
          options?.amount,
          options?.mutualCeiling,
          options?.amount_repaid,
          options?.amount_to_be_paid,
        ]);

        if (this._empty(options?.id)) {
          options.id = planNew.insertId;
        }
        if (!this._empty(options?.acceptedOn)) {
          const updateDeltaQuery = `
          UPDATE T_DENTAL_QUOTATION_DQO
          SET DQO_DATE_ACCEPT = ?
          WHERE PLF_ID = ?
          AND DQO_DATE_ACCEPT IS NULL`;
          await manager.query(updateDeltaQuery, [
            options?.acceptedOn,
            options?.id,
          ]);
        }
        for (const [key, eventRoot] of options?.events?.entries()) {
          let event = eventRoot;
          const tasks = [];
          event = {
            id: 0,
            name: null,
            start: null,
            end: null,
            user: null,
            event_type: null,
            color: {
              background: -12303,
              foreground: -3840,
            },
            plan: {
              pos: 1,
              duration: '00:30:00',
              delay: 7,
            },
            tasks: [],
            ...event,
          };

          const color = event?.color?.background ?? event?.color;

          const insertEvents = await manager.query(
            `
          INSERT INTO T_EVENT_EVT (EVT_ID, USR_ID, CON_ID, event_type_id, EVT_NAME, EVT_START, EVT_END, EVT_COLOR)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          USR_ID = VALUES(USR_ID),
          CON_ID = VALUES(CON_ID),
          event_type_id = VALUES(event_type_id),
          EVT_NAME = VALUES(EVT_NAME),
          EVT_START = VALUES(EVT_START),
          EVT_END = VALUES(EVT_END),
          EVT_COLOR = VALUES(EVT_COLOR)`,
            [
              event?.id,
              event?.user?.id,
              options?.patient_id,
              event?.event_type?.id ?? null,
              event?.name ?? null,
              event?.start ?? null,
              event?.end ?? null,
              color,
            ],
          );

          if (this._empty(event?.id)) {
            event.id = insertEvents.insertId;
            await manager.query(
              `
            INSERT INTO T_REMINDER_RMD (USR_ID, EVT_ID, RMT_ID, RMR_ID, RMU_ID, appointment_reminder_library_id, RMD_NBR)
            SELECT USR_ID, ?, RMT_ID, RMR_ID, RMU_ID, RML_ID, RML_NBR
            FROM T_REMINDER_LIBRARY_RML
            WHERE USR_ID = ?`,
              [event?.id, event?.user?.id],
            );
          }

          await manager.query(
            `
          INSERT IGNORE INTO event_occurrence_evo (evo_id, evt_id, resource_id, evo_date)
          SELECT evo.evo_id, EVT.EVT_ID, EVT.resource_id, DATE(EVT.EVT_START)
          FROM T_EVENT_EVT EVT
          LEFT OUTER JOIN event_occurrence_evo evo ON evo.evt_id = EVT.EVT_ID
          WHERE EVT.EVT_ID = ?`,
            [event?.id],
          );

          let duration = event?.plan?.duration;
          if (!/^\d{2}:\d{2}(:\d{2})?$/.test(duration)) {
            duration = '00:30:00';
          }

          await manager.query(
            `
          INSERT INTO T_PLAN_EVENT_PLV (EVT_ID, PLF_ID, PLV_POS, PLV_DELAY, duration)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          PLF_ID = VALUES(PLF_ID),
          PLV_POS = VALUES(PLV_POS),
          PLV_DELAY = VALUES(PLV_DELAY),
          duration = VALUES(duration)`,
            [event?.id, options?.id, key, event?.plan?.delay, duration],
          );

          for (const [key, taskRoot] of event?.tasks?.entries()) {
            let task = taskRoot;
            task = {
              id: 0,
              name: '',
              pos: 0,
              duration: '00:00:00',
              amount: 0,
              color: -12303,
              qty: 1,
              ccam_family: null,
              dental: null,
              ...task,
            };

            const insertEventTaskk = await manager.save(EventTaskEntity, {
              libraryActId: task?.library_act_id ?? null,
              libraryActQuantityId: task?.library_act_quantity_id,
              usrId: event?.user?.id,
              conId: options?.patient_id,
              evtId: event?.id,
              parentId: task?.parent_id ?? null,
              name: task?.name,
              date: event?.start ?? null,
              position: key,
              duration: task?.duration,
              amount: task?.amount,
              color: task?.color,
              qty: task?.qty,
              ccamFamily: task?.ccam_family,
            } as EventTaskEntity);

            if (this._empty(task?.id)) {
              task.id = insertEventTaskk?.id;
              const act = await manager.findOne(EventTaskEntity, {
                where: { id: task?.id },
                relations: {
                  libraryActQuantity: {
                    traceabilities: true,
                    act: { traceabilities: true },
                  },
                  traceabilities: true,
                },
              });
              const libraryActQuantity = act?.libraryActQuantity;
              if (libraryActQuantity) {
                let traceabilityStatus = TraceabilityStatusEnum.NONE;
                const traceabilities = [...libraryActQuantity?.traceabilities];

                if (libraryActQuantity?.traceabilityMerged)
                  traceabilities.concat(
                    libraryActQuantity?.act?.traceabilities,
                  );
                if (traceabilities.length > 0) {
                  traceabilityStatus = TraceabilityStatusEnum.UNFILLED;
                  for (const traceability of traceabilities) {
                    if (
                      !act.traceabilities.some((x) => {
                        return x.id === traceability.id;
                      })
                    ) {
                      act.traceabilities.push(traceability);
                      traceability.act = act;
                    }
                    if (traceability.reference) {
                      traceabilityStatus = TraceabilityStatusEnum.FILLED;
                    }
                  }
                }

                act.traceabilityStatus = traceabilityStatus;

                await manager.save(EventTaskEntity, act);
              }
            }

            if (!this._empty(task?.dental)) {
              const dental = {
                ald: 0,
                type: null,
                teeth: [],
                coef: 1,
                comp: null,
                key: null,
                purchasePrice: 0,
                ccamCode: null,
                ccamOpposable: 0,
                ccamNPC: 0,
                ccamNR: 0,
                ccamTelem: 1,
                ccamModifier: null,
                secuAmount: 0,
                secuRepayment: 0,
                mutualRepaymentType: 0,
                mutualRepaymentRate: 0,
                mutualRepayment: 0,
                mutualComplement: 0,
                personRepayment: 0,
                personAmount: 0,
                ...task.dental,
              };

              const sql = `
                INSERT INTO T_DENTAL_EVENT_TASK_DET (
                    ETK_ID,
                    ccam_id,
                    ngap_key_id,
                    dental_material_id,
                    DET_TOOTH,
                    DET_TYPE,
                    DET_COEF,
                    DET_EXCEEDING,
                    DET_CODE,
                    DET_COMP,
                    DET_PURCHASE_PRICE,
                    DET_CCAM_CODE,
                    DET_CCAM_OPPOSABLE,
                    DET_CCAM_TELEM,
                    DET_CCAM_MODIFIER,
                    exceptional_refund,
                    DET_SECU_AMOUNT,
                    DET_SECU_REPAYMENT,
                    DET_MUTUAL_REPAYMENT_TYPE,
                    DET_MUTUAL_REPAYMENT_RATE,
                    DET_MUTUAL_REPAYMENT,
                    DET_MUTUAL_COMPLEMENT,
                    DET_PERSON_REPAYMENT,
                    DET_PERSON_AMOUNT
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                ccam_id = VALUES(ccam_id),
                ngap_key_id = VALUES(ngap_key_id),
                dental_material_id = VALUES(dental_material_id),
                DET_TOOTH = VALUES(DET_TOOTH),
                DET_TYPE = VALUES(DET_TYPE),
                DET_COEF = VALUES(DET_COEF),
                DET_EXCEEDING = VALUES(DET_EXCEEDING),
                DET_CODE = VALUES(DET_CODE),
                DET_COMP = VALUES(DET_COMP),
                DET_PURCHASE_PRICE = VALUES(DET_PURCHASE_PRICE),
                DET_CCAM_CODE = VALUES(DET_CCAM_CODE),
                DET_CCAM_OPPOSABLE = VALUES(DET_CCAM_OPPOSABLE),
                DET_CCAM_TELEM = VALUES(DET_CCAM_TELEM),
                DET_CCAM_MODIFIER = VALUES(DET_CCAM_MODIFIER),
                exceptional_refund = VALUES(exceptional_refund),
                DET_SECU_AMOUNT = VALUES(DET_SECU_AMOUNT),
                DET_SECU_REPAYMENT = VALUES(DET_SECU_REPAYMENT),
                DET_MUTUAL_REPAYMENT_TYPE = VALUES(DET_MUTUAL_REPAYMENT_TYPE),
                DET_MUTUAL_REPAYMENT_RATE = VALUES(DET_MUTUAL_REPAYMENT_RATE),
                DET_MUTUAL_REPAYMENT = VALUES(DET_MUTUAL_REPAYMENT),
                DET_MUTUAL_COMPLEMENT = VALUES(DET_MUTUAL_COMPLEMENT),
                DET_PERSON_REPAYMENT = VALUES(DET_PERSON_REPAYMENT),
                DET_PERSON_AMOUNT = VALUES(DET_PERSON_AMOUNT)`;
              let teeth = dental?.teeth;
              if (Array.isArray(teeth)) {
                teeth = teeth.join(',');
              }

              teeth = teeth.trim() ? teeth.trim() : null;
              if (dental?.code === 'HBQK002' && teeth.length === 0) {
                teeth = '00';
              }

              await manager.query(sql, [
                task?.id,
                dental?.ccam_id ?? null,
                dental?.ngap_key_id ?? null,
                dental?.dental_material_id ?? null,
                teeth?.length === 0 ? null : teeth,
                dental?.type,
                dental?.coef,
                this._empty(dental?.exceeding) ? null : dental?.exceeding,
                this._empty(dental?.code) ? null : dental?.code,
                this._empty(dental?.comp) ? null : dental?.comp,
                !dental?.purchasePrice || dental?.purchasePrice === ''
                  ? 0
                  : dental?.purchasePrice,
                dental?.ccamCode,
                !dental?.ccamOpposable || dental?.ccamOpposable === ''
                  ? 0
                  : dental?.ccamOpposable,
                dental?.ccamTelem,
                dental?.ccamModifier,
                dental?.exceptional_refund,
                dental?.secuAmount,
                dental?.secuRepayment,
                dental?.mutualRepaymentType,
                dental?.mutualRepaymentRate,
                dental?.mutualRepayment,
                dental?.mutualComplement,
                dental?.personRepayment,
                dental?.personAmount,
              ]);
            }
            tasks.push(task?.id);
          }

          if (tasks.length > 0) {
            const listTask = tasks.join();
            const sql = `
              DELETE ETK, DET
              FROM T_EVENT_TASK_ETK ETK
              LEFT OUTER JOIN T_DENTAL_EVENT_TASK_DET DET ON DET.ETK_ID = ETK.ETK_ID
              WHERE ETK.EVT_ID = ${event?.id}
              AND ETK.ETK_ID NOT IN (${listTask})`;
            await manager.query(sql);
          }

          events.push(event?.id);
        }

        if (events.length > 0) {
          const eventStatement = `
          SELECT
            EVT_ID
          FROM T_PLAN_EVENT_PLV
          WHERE PLF_ID = ?
            AND EVT_ID NOT IN (${events.join()})`;
          const eventResult = await manager.query(eventStatement, [
            options?.id,
          ]);
          const eventsId = eventResult.map((item) => item.EVT_ID);
          for (const eventId of eventsId) {
            await manager.query(`
            DELETE T_PLAN_EVENT_PLV
            FROM T_PLAN_EVENT_PLV
            JOIN T_EVENT_EVT
            WHERE T_EVENT_EVT.EVT_ID = ${eventId}
            AND T_EVENT_EVT.EVT_ID = T_PLAN_EVENT_PLV.EVT_ID`);

            await manager.query(`
            DELETE T_DENTAL_EVENT_TASK_DET
            FROM T_DENTAL_EVENT_TASK_DET
            JOIN T_EVENT_TASK_ETK
            WHERE T_EVENT_TASK_ETK.EVT_ID = ${eventId}
            AND T_EVENT_TASK_ETK.ETK_ID = T_DENTAL_EVENT_TASK_DET.ETK_ID`);

            await manager.query(`
            DELETE T_EVENT_TASK_ETK
            FROM T_EVENT_TASK_ETK
            WHERE T_EVENT_TASK_ETK.EVT_ID = ${eventId}`);

            await manager.query(`
            DELETE FROM event_occurrence_evo
            WHERE evt_id = ${eventId}`);

            await manager.query(`
            DELETE T_EVENT_EVT
            FROM T_EVENT_EVT
            WHERE T_EVENT_EVT.EVT_ID = ${eventId}`);
          }
        }
        return options?.id;
      } catch (error) {
        throw new CBadRequestException(error);
      }
    });
  }
  /**
   * File: /contact/plans/findAll.php, line 23->94
   * @function main function
   *
   */

  async findAll(request: FindAllStructDto) {
    const { patientId, type } = request;

    const plansResult = [];

    const queryBuiler = this.dataSource.createQueryBuilder();

    const planQuery = `
    SELECT
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
    FROM T_PLAN_PLF
    JOIN T_PLAN_EVENT_PLV
    JOIN T_EVENT_EVT
    WHERE T_PLAN_PLF.PLF_TYPE = ?
            AND T_PLAN_PLF.PLF_ID = T_PLAN_EVENT_PLV.PLF_ID
            AND T_PLAN_EVENT_PLV.EVT_ID = T_EVENT_EVT.EVT_ID
            AND T_EVENT_EVT.CON_ID = ?
    GROUP BY T_PLAN_PLF.PLF_ID
    ORDER BY T_PLAN_PLF.updated_at DESC`;

    const plans = await this.dataSource.query(planQuery, [type, patientId]);

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
        plans[index]['doctor_id'] = null;

        try {
          // Récupération de l'échéancier
          const paymentSchedule = await this.paymentPlanService.find(
            plans[index].payment_schedule_id,
            doctor['group_id'],
          );

          plans[index].payment_schedule = paymentSchedule;
        } catch (error) {
          plans[index].payment_schedule = null;
        } finally {
          plans[index].payment_schedule_id = null;
        }

        plansResult.push(plans[index]);
      }
    }

    return plansResult;
  }

  //File /php/plan/delete.php, line 6-203
  async deleteOne(request: IdStructDto, identity: UserIdentity) {
    const { id } = request;
    const queryRunner = this.dataSource.createQueryRunner();
    const queryBuiler = this.dataSource.createQueryBuilder();
    try {
      const selectPlan = `
        T_PLAN_PLF.PLF_TYPE AS type,
        T_PLAN_PLF.payment_schedule_id,
        T_EVENT_EVT.CON_ID AS patient_id`;

      const currentPlanPlf = queryBuiler
        .select(selectPlan)
        .from('T_PLAN_PLF', 'T_PLAN_PLF')
        .innerJoin('T_PLAN_EVENT_PLV', 'T_PLAN_EVENT_PLV')
        .innerJoin('T_EVENT_EVT', 'T_EVENT_EVT')
        .where('T_PLAN_PLF.PLF_ID = :planId', { planId: id })
        .andWhere('T_PLAN_PLF.PLF_ID = T_PLAN_EVENT_PLV.PLF_ID')
        .andWhere('T_PLAN_EVENT_PLV.EVT_ID = T_EVENT_EVT.EVT_ID')
        .groupBy('T_PLAN_PLF.PLF_ID');
      const plan = await currentPlanPlf.getRawOne();

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

  //File /php/plan/find.php, line 6-46
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
      throw new CBadRequestException(error);
    }
  }

  async duplicate(payload: DuplicatePlanDto, organizationId: number) {
    // début de la transaction
    await this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        try {
          // vérification si le plan de traitement appartient bien au groupe
          // de l'utilisateur connecté puis récupération du type de plan de
          // traitement à dupliquer
          // let { id, name, type } = payload
          const planificationId = payload.id;
          const planificationName = payload.name;
          let planificationType = payload.type;
          const planPlfQueryBuilder = this.dataSource.createQueryBuilder(
            PlanPlfEntity,
            'PLF',
          );
          const currentPlanPlf: PlanPlfEntity = await planPlfQueryBuilder
            .select()
            .innerJoin(`T_PLAN_EVENT_PLV`, 'PLV')
            .innerJoin(`T_EVENT_EVT`, `EVT`)
            .innerJoin(`T_USER_USR`, `USR`)
            .where(`PLF.PLF_ID = :planificationId`, { planificationId })
            .andWhere(`PLF.PLF_ID = PLV.PLF_ID`)
            .andWhere(`PLV.EVT_ID = EVT.EVT_ID`)
            .andWhere(`EVT.USR_ID = USR.USR_ID`)
            .andWhere(`USR.organization_id = :organizationId`, {
              organizationId,
            })
            .getOne();

          if (!currentPlanPlf) {
            throw new CBadRequestException(
              'You cannot access to this planification',
            );
          } else if (
            planificationType !== EnumPlanPlfType?.PLAN &&
            planificationType !== EnumPlanPlfType.QUOTATION
          ) {
            planificationType = currentPlanPlf?.type;
          }

          const newPlanPlf = await transactionalEntityManager.save(
            PlanPlfEntity,
            {
              organizationId: currentPlanPlf?.organizationId,
              userId: currentPlanPlf?.userId,
              patientId: currentPlanPlf?.patientId,
              name: planificationName,
              type: planificationType,
              amount: currentPlanPlf?.amount,
              mutualCeiling: currentPlanPlf?.mutualCeiling,
              personRepayment: currentPlanPlf?.personRepayment,
              personAmount: currentPlanPlf?.personAmount,
              acceptedOn:
                currentPlanPlf?.type === 'quotation'
                  ? null
                  : currentPlanPlf?.acceptedOn,
            },
          );

          const tEvenEvtQueryBuilder = this.dataSource.createQueryBuilder(
            EventEntity,
            'EVT',
          );
          const evenEVTs: EventEntity[] = await tEvenEvtQueryBuilder
            .select()
            .innerJoin('T_PLAN_EVENT_PLV', 'PLV')
            .where('EVT.EVT_ID = PLV.EVT_ID')
            .andWhere('PLV.PLF_ID = :planificationId', { planificationId })
            .getMany();

          for (let evenEVT of evenEVTs) {
            const appointmentId = evenEVT?.id;
            const {
              usrId,
              conId,
              type,
              name,
              start,
              startTimezone,
              end,
              endTimezone,
              msg,
              color,
              state,
              solicitation,
            } = evenEVT;
            const newEventEvt = await transactionalEntityManager.save(
              EventEntity,
              {
                usrId,
                conId,
                type,
                name,
                start,
                startTimezone,
                end,
                endTimezone,
                msg,
                color,
                state,
                solicitation,
                delete: evenEVT?.delete,
                private: evenEVT?.private,
              },
            );

            //unknown
            // Duplication de l'occurrence du rendez-vous.
            //  $connection->executeUpdate("CREATE TEMPORARY TABLE mytmp SELECT * FROM event_occurrence_evo WHERE evt_id = ?", array($appointmentId));
            //  $connection->executeUpdate("UPDATE mytmp SET evo_id = NULL, evt_id = ?, evo_date = '0000-00-00'", array($appointmentDuplicateId));
            //  $connection->executeUpdate("INSERT INTO event_occurrence_evo SELECT * FROM mytmp");
            //  $connection->executeUpdate("DROP TEMPORARY TABLE IF EXISTS mytmp");
            await transactionalEntityManager.query(
              `CREATE TEMPORARY TABLE mytmp SELECT * FROM event_occurrence_evo WHERE evt_id = ?`,
              [appointmentId],
            );
            await transactionalEntityManager.query(
              `UPDATE mytmp SET evo_id = NULL, evt_id = ?, evo_date = '0000-00-00'`,
              [newEventEvt?.id],
            );
            await transactionalEntityManager.query(
              `INSERT INTO event_occurrence_evo SELECT * FROM mytmp`,
            );
            await transactionalEntityManager.query(
              `DROP TEMPORARY TABLE IF EXISTS mytmp`,
            );

            await transactionalEntityManager.query(
              `
            INSERT INTO T_PLAN_EVENT_PLV (EVT_ID,PLF_ID,PLV_POS,PLV_DELAY, duration)
            SELECT ?, ?, PLV_POS, PLV_DELAY, duration
            FROM T_PLAN_EVENT_PLV PLV
            WHERE PLV.EVT_ID = ?
              AND PLV.PLF_ID = ?
            `,
              [newEventEvt?.id, newPlanPlf?.id, appointmentId, planificationId],
            );

            const tEvenTaskETKQueryBuilder = this.dataSource.createQueryBuilder(
              EventTaskEntity,
              'ETK',
            );
            const tEventTaskETKs = await tEvenTaskETKQueryBuilder
              .select()
              .innerJoin('T_EVENT_EVT', 'EVT')
              .where('ETK.EVT_ID = EVT.EVT_ID')
              .andWhere('EVT.EVT_ID = :appointmentId', { appointmentId })
              .getMany();
            const newTasks = [];
            for (const task of tEventTaskETKs) {
              const newTask = await transactionalEntityManager.save(
                EventTaskEntity,
                {
                  ...task,
                  evtId: newEventEvt.id,
                  id: null,
                },
              );
              const currentDental = await this.dataSource.manager.findOne(
                DentalEventTaskEntity,
                {
                  where: {
                    id: task.id,
                  },
                },
              );
              const newDentalTask = await transactionalEntityManager.save(
                DentalEventTaskEntity,
                { ...currentDental, fse: null, id: newTask.id },
              );
              newTask.dental = newDentalTask;
              newTasks.push(newTask);
            }
            newEventEvt.tasks = newTasks;
            evenEVT = newEventEvt;
          }
          return { ...newPlanPlf, events: evenEVTs };
        } catch (err) {
          throw new CBadRequestException(
            ErrorCode.STATUS_INTERNAL_SERVER_ERROR,
          );
        }
      },
    );
  }
  //File /php/plan.php, line 6-55
  async save(
    request: ActionSaveStructDto,
    body: BodySaveStructDto,
    identity: UserIdentity,
  ) {
    try {
      const { action } = request;
      if (action === 'save') {
        const planId = await this._save(body, identity.org);
        // const patientId = plan?.patient_id
        // const accessType = !request?.id ? 1: 2

        //@TODO
        // switch ($data['type']) {
        //   case 'plan':
        //     Ids\Log:: write('Plan de traitement', $patientId, $accessType);
        //     break;
        //   case 'quotation':
        //     Ids\Log:: write('Devis', $patientId, $accessType);
        //     break;
        return await this._getPlan(planId, identity.org);
      } else {
        throw new BadRequestException('unknown action');
      }
    } catch (error) {
      throw new CBadRequestException(error);
    }
  }
}
