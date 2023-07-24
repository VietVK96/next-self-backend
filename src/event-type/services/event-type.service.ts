import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventTypeEntity } from 'src/entities/event-type.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Not, Repository } from 'typeorm';
import {
  CreateEventTypeDto,
  DuplicateEventTypeDto,
  UpdateEventTypeDto,
} from '../dto/event-type.tdo';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { AccountStatusEnum } from 'src/enum/account-status.enum';
import { SuccessCode } from 'src/constants/success';

@Injectable()
export class EventTypeService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(EventTypeEntity)
    private readonly eventTypeRepository: Repository<EventTypeEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  private async _getPractitioners() {
    const user = await this.userRepository.find({
      where: {
        client: Not(AccountStatusEnum.TERMINATED),
      },
      relations: {
        medical: true,
        eventTypes: true,
      },
      order: {
        lastname: 'ASC',
        firstname: 'ASC',
      },
    });
    return user;
  }

  async findAll(id: number) {
    const user = await this.userRepository.findOneOrFail({
      where: { id },
      relations: { eventTypes: true },
    });
    return user.eventTypes.map(
      ({
        id,
        organizationId,
        userId,
        label,
        position,
        duration,
        color,
        isVisible,
      }) => ({
        id,
        organizationId,
        userId,
        label,
        position,
        duration,
        color,
        isVisible,
      }),
    );
  }

  async create(
    userId: number,
    organizationId: number,
    payload: CreateEventTypeDto,
  ) {
    //@TODO Not understand validator
    // $violations = $container -> get('validator') -> validate($eventType);
    // if ($violations -> count()) {
    //   $session -> getFlashBag() -> add('error', (string) $violations);
    //   return (new RedirectResponse('create.php')) -> send();
    // }

    return await this.eventTypeRepository.save({
      ...payload,
      userId,
      organizationId,
    });
  }

  async duplicate(userId: number, payload: DuplicateEventTypeDto) {
    const practitionerIds = payload.practitioners;
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
      relations: { eventTypes: true },
    });
    const userPractitioners = await this._getPractitioners();
    const practitioners = userPractitioners.filter(
      (item) => item.id !== user.id,
    );
    if (!user.admin) {
      throw new CBadRequestException(ErrorCode.PERMISSION_DENIED);
    }

    if (practitioners.length === 0) {
      throw new CBadRequestException(ErrorCode.EVENT_TYPE_PRATITIONERS_EMPTY);
    }

    for (const id of practitionerIds) {
      const practitionersFiltered = practitioners.filter(
        (item) => item.id === id,
      );
      const practitioner = practitionersFiltered.shift();
      if (!practitioner) {
        throw new CBadRequestException(ErrorCode.NOT_FOUND);
      }

      if (payload.delete_all) {
        for (const evt of practitioner.eventTypes) {
          await this.eventTypeRepository.remove(evt);
        }
      }

      for (const evt of user.eventTypes) {
        await this.eventTypeRepository.save({
          ...evt,
          id: null,
          userId: practitioner.id,
        });
      }
    }
    return SuccessCode.COPY_SUCCESS;
  }

  async update(id: number, payload: UpdateEventTypeDto) {
    const currentEventType = await this.eventTypeRepository.findOneOrFail({
      where: { id },
    });
    const newEventType = {
      ...currentEventType,
      ...payload,
    };

    //@TODO Not understand validator
    // $violations = $container -> get('validator') -> validate($eventType);
    // if ($violations -> count()) {
    //   $session -> getFlashBag() -> add('error', (string) $violations);
    //   return (new RedirectResponse('create.php')) -> send();
    // }

    return await this.eventTypeRepository.save(newEventType);
  }

  async delete(id: number) {
    const currentEventType = await this.eventTypeRepository.findOneOrFail({
      where: { id },
    });
    if (currentEventType)
      await this.eventTypeRepository.remove(currentEventType);
    return SuccessCode.DELETE_SUCCESS;
  }
}
