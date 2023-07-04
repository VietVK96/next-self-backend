import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { EventTaskDto } from '../dto/task.contact.dto';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { UserPreferenceEntity } from 'src/entities/user-preference.entity';

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

    // const datetime = moment
  }
}
