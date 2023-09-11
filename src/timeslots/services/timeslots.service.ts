import { Injectable } from '@nestjs/common';
import {
  TimeslotRes,
  TimeslotsAllRes,
} from '../response/findAll.timeslots.res';
import { DataSource, Repository, Connection } from 'typeorm';
import { ErrorCode } from 'src/constants/error';
import { TimeslotEntity } from 'src/entities/timeslot.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTimeslotPayloadDto } from '../dto/create.timeslots.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { RRule } from 'rrule';
import * as dayjs from 'dayjs';

@Injectable()
export class TimeslotsService {
  constructor(
    @InjectRepository(TimeslotEntity)
    private readonly timeslotRepo: Repository<TimeslotEntity>,
    private readonly dataSource: DataSource,
    private readonly connection: Connection,
  ) {}

  getStartDay(date: string) {
    const modifiedDate = new Date(date);
    modifiedDate.setHours(0, 0, 0, 0);
    const year = modifiedDate.getFullYear();
    const month = String(modifiedDate.getMonth() + 1).padStart(2, '0');
    const day = String(modifiedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  getEndDay(date: string) {
    const modifiedDate = new Date(date);
    modifiedDate.setDate(modifiedDate.getDate() + 1);

    const year = modifiedDate.getFullYear();
    const month = String(modifiedDate.getMonth() + 1).padStart(2, '0');
    const day = String(modifiedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  //php/timeslot/index.php full file
  async findAll(
    resources: number[],
    startDate: string,
    endDate: string,
  ): Promise<TimeslotsAllRes[]> {
    try {
      const timeslots = await this.dataSource.query(
        `SELECT timeslot.id, resource_id as resourceId, resource.name as resourceName, start_date, 
      end_date, timeslot.color, title FROM timeslot JOIN resource ON timeslot.resource_id = resource.id 
      WHERE resource_id IN (?) and start_date >= ? AND end_date < ?
       ORDER BY start_date ASC, end_date ASC`,
        [resources, this.getStartDay(startDate), this.getEndDay(endDate)],
      );
      return timeslots.map((timeslot) => {
        const color: {
          background: string;
          foreground: string;
        } = timeslot.color;
        return {
          ...timeslot,
          color: {
            background: color.background,
            foreground: color.foreground,
          },
          start_date: dayjs(timeslot.start_date).format('YYYY-MM-DD HH:mm:ss'),
          end_date: dayjs(timeslot.end_date).format('YYYY-MM-DD HH:mm:ss'),
        };
      });
    } catch {
      throw new CBadRequestException(ErrorCode.FRESH_TOKEN_WRONG);
    }
  }

  //php/timeslot/show.php full file
  async find(id: number): Promise<TimeslotRes> {
    try {
      const timeslot = await this.dataSource
        .createQueryBuilder()
        .select([
          'TSL.id as id',
          'TSL.resource_id',
          'TSL.recurring_pattern_id',
          'TSL.start_date as start_date',
          'TSL.end_date as end_date',
          'TSL.color as color',
          'TSL.title as title',
          'RSR.name',
          'RSR.color',
          'RSR.use_default_color',
          'RCP.week_frequency',
          'RCP.week_days',
          'RCP.until',
        ])
        .from('timeslot', 'TSL')
        .leftJoin('TSL.resource', 'RSR')
        .leftJoin('TSL.recurringPattern', 'RCP')
        .where('TSL.id = :id', { id })
        .getRawOne();

      let recurringPattern = null;
      if (timeslot.recurring_pattern_id !== null) {
        recurringPattern = {
          id: timeslot.recurring_pattern_id,
          week_frequency: timeslot.week_frequency,
          week_days: timeslot.week_days ? timeslot.week_days.split(',') : [],
          until: timeslot.RCP_until,
        };
      }

      const result: TimeslotRes = {
        id: timeslot.id,
        resource: {
          id: timeslot.resource_id,
          name: timeslot.name,
          color: timeslot.color,
          use_default_color: timeslot.use_default_color,
        },
        recurring_pattern: recurringPattern,
        start_date: dayjs(timeslot.start_date).format('YYYY-MM-DD HH:mm:ss'),
        end_date: dayjs(timeslot.end_date).format('YYYY-MM-DD HH:mm:ss'),
        color: timeslot.color,
        title: timeslot.title,
      };

      return result;
    } catch (err) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  //php/timeslot/store.php full file
  async create(payload: CreateTimeslotPayloadDto) {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      if (payload.recurring) {
        const createRecurringPattern = await queryRunner.manager.query(
          `INSERT INTO recurring_pattern(week_frequency,week_days,until) VALUES (?,?,?)`,
          [
            payload?.recurring_pattern?.week_frequency,
            payload?.recurring_pattern?.week_days.join(',').replace(/\s/g, ''),
            payload?.recurring_pattern?.until,
          ],
        );

        const startDateTime = new Date(payload.start_date);
        const endDateTime = new Date(payload.end_date);
        const weekFrequency = payload.recurring_pattern.week_frequency;
        const weekDays = payload.recurring_pattern.week_days;
        const untilDate = dayjs(startDateTime)
          .add(1, 'year')
          .format('YYYY-MM-DD');

        const byWeekdays = weekDays.map((weekday) => RRule[weekday]);

        const rule = new RRule({
          freq: RRule.WEEKLY,
          interval: weekFrequency,
          byweekday: byWeekdays,
          dtstart: startDateTime,
          until: payload.recurring_pattern.until
            ? new Date(payload.recurring_pattern.until)
            : new Date(untilDate),
        });

        const recurrences = rule.all();

        const timeslots = recurrences.map((recurrence) => {
          return {
            resource_id: payload.resourceId,
            recurring_pattern_id: createRecurringPattern.insertId,
            start_date: recurrence,
            end_date: new Date(
              recurrence.getTime() +
                (endDateTime.getTime() - startDateTime.getTime()),
            ),
            color: payload.color,
            title: payload.title,
          };
        });
        const timeslotPrm = [];
        for (const iterator of timeslots) {
          timeslotPrm.push(
            queryRunner.manager.query(
              `INSERT INTO timeslot(resource_id,recurring_pattern_id,start_date,end_date,color,title) values(?,?,?,?,?,?)`,
              [
                iterator?.resource_id,
                iterator?.recurring_pattern_id,
                iterator?.start_date,
                iterator?.end_date,
                JSON.stringify(payload.color),
                payload?.title,
              ],
            ),
          );
        }
        await Promise.all(timeslotPrm);
      } else {
        await queryRunner.manager.query(
          `INSERT INTO timeslot(resource_id,start_date,end_date,color,title) values(?,?,?,?,?)`,
          [
            payload?.resourceId,
            payload?.start_date,
            payload?.end_date,
            JSON.stringify(payload.color),
            payload?.title,
          ],
        );
      }
      await queryRunner.commitTransaction();
      return 1;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(error);
    } finally {
      await queryRunner.release();
    }
  }

  //php/timeslot/delete.php full file
  async delete(id: number, scope: string) {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const recurringPatternId = await queryRunner.manager
        .createQueryBuilder()
        .select(`recurring_pattern_id as getId`)
        .from(TimeslotEntity, 'TSL')
        .where('TSL.id = :id', { id })
        .getRawOne();
      if (!recurringPatternId)
        throw new CBadRequestException(ErrorCode.NOT_FOUND_ID);

      if (recurringPatternId?.getId === null || scope === 'one') {
        const deleteTimeslot = await queryRunner.manager.query(
          `DELETE FROM timeslot WHERE id = ?`,
          [id],
        );
        if (deleteTimeslot.affectedRows === 0)
          throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
      } else {
        if (scope === 'all') {
          const deleteTimeslot = await queryRunner.manager.query(
            `DELETE FROM timeslot WHERE recurring_pattern_id = ?`,
            [recurringPatternId.getId],
          );
          const deleteRulesId = await queryRunner.manager.query(
            `delete from recurring_pattern where id = ?`,
            [recurringPatternId.getId],
          );
          if (
            deleteTimeslot.affectedRows === 0 ||
            deleteRulesId.affectedRows === 0
          )
            throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
        }
        if (scope === 'tail') {
          const deleteTimeslot = await queryRunner.manager.query(
            `DELETE FROM timeslot WHERE recurring_pattern_id = ? AND id >= ?`,
            [recurringPatternId.getId, id],
          );
          if (deleteTimeslot.affectedRows === 0)
            throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
        }
      }
      await queryRunner.commitTransaction();
      return 1;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }
}
