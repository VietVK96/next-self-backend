import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { EventTaskDto } from '../dto/task.contact.dto';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(UserPreferenceEntity)
    private userPreferenceRepo: Repository<UserPreferenceEntity>,
  ) {}

  async updateEventTask(payload: EventTaskDto) {
    if (
      !(await this.eventTaskRepository.find({
        where: { id: payload.id, conId: payload.user },
      }))
    ) {
      throw new CNotFoundRequestException(ErrorCode.STATUS_NOT_FOUND);
    }
    await this.eventTaskRepository.update(payload.id, { state: 0 });
  }

  /**
   * php\event\task\realized.php line 15->76
   * @param payload
   * @param identity
   */
  async realizeEventTask(payload: EventTaskDto, identity: UserIdentity) {
    // Récupération du fuseau horaire
    const userPreference: UserPreferenceEntity =
      await this.userPreferenceRepo.findOne({
        select: {
          timezone: true,
        },
        where: {
          usrId: payload.user,
        },
      });

    dayjs.extend(utc);
    dayjs.extend(timezone);
    const datetime: string = dayjs()
      .tz(userPreference.timezone)
      .format('YYYY-MM-DD');

    // Récupération de l'identifiant du patient
    const eventTask: EventTaskEntity = await this.eventTaskRepository
      .createQueryBuilder('event')
      .select('event.conId')
      .innerJoin('event.patient', 'patient')
      .where('event.id = :id', { id: payload.id })
      .andWhere('event.conId = patient.id')
      .andWhere('patient.organizationId = :orgId', { orgId: identity.org })
      .getOne();

    if (!eventTask) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND_PATIENT);
    }

    // Modification des informations de l'acte
    await this.eventTaskRepository.update(payload.id, {
      status: 1,
      date: datetime,
    });

    // Traçabilité IDS
    // @TODO Ids\Log::write('Acte', $patientId, 2);
  }
}
