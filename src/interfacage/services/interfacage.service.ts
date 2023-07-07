import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { ShowActionExceptionFilter } from 'src/common/exceptions/show-action.exception';
import { FsDto } from '../dto/index.dto';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode } from 'src/constants/error';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { FseEntity } from 'src/entities/fse.entity';
import { format } from 'date-fns';
import { CaresheetModeEnum } from 'src/enum/caresheet.enum';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';

@Injectable()
export class InterfacageService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(FseEntity)
    private fseRepository: Repository<FseEntity>,
    @InjectRepository(FseEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(EventTaskEntity)
    private dentalEventTaskRepository: Repository<DentalEventTaskEntity>,
    @InjectRepository(DentalEventTaskEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async fs(request: FsDto) {
    try {
      const { patient_id, user_id, act_id } = request;
      const [patient, user] = await Promise.all([
        this.patientRepository.findOneOrFail({ where: { id: patient_id } }),
        this.userRepository.findOneOrFail({ where: { id: user_id } }),
      ]);
      const dataActs: EventTaskEntity[] =
        await this.eventTaskRepository.findByIds(act_id);
      const acts = dataActs.filter((act) => act.conId === patient.id);
      if (!!acts) {
        throw new CBadRequestException(ErrorCode.ERROR_CARESHEET_ACTS_IS_EMPTY);
      }
      const caresheet: FseEntity = null;
      caresheet.usrId = user?.id;
      caresheet.conId = patient?.id;
      caresheet.date = format(new Date(), 'yyyy-MM-dd');
      caresheet.mode = CaresheetModeEnum.PAPIER;
      caresheet.amountAssure = 0;
      acts.forEach((act) => {
        act.status = 2;
        // $caresheet->addActMedical($act->getMedical());
        caresheet.amount = act?.amount + caresheet?.amount;
        caresheet.amountAssure = caresheet?.amountAssure + act?.amount;
      });

      return {};
    } catch (error) {
      return new ShowActionExceptionFilter();
    }
  }

  // private compute(caresheet: FseEntity) {

  // }

  // private add(actMedicals, associationCode = 4) {

  // }
}
