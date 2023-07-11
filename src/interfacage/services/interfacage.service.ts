import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
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
import { CcamEntity } from 'src/entities/ccam.entity';

@Injectable()
export class InterfacageService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(DentalEventTaskEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(FseEntity)
    private fseRepository: Repository<FseEntity>,
    @InjectRepository(FseEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(EventTaskEntity)
    private dentalEventTaskRepository: Repository<DentalEventTaskEntity>,
    @InjectRepository(CcamEntity)
    private ccamRepository: Repository<CcamEntity>,
  ) {}

  /**
   * php/interfacage/fs.php
   */

  async fs(request: FsDto) {
    try {
      const { patient_id, user_id, act_id } = request;
      const [patient, user] = await Promise.all([
        this.patientRepository.findOneOrFail({ where: { id: patient_id } }),
        this.userRepository.findOneOrFail({ where: { id: user_id } }),
      ]);
      const dataActs: EventTaskEntity[] = await this.eventTaskRepository.find({
        relations: ['medical'],
        where: { id: In(act_id) },
      });
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
        const actMedical = this.dentalEventTaskRepository.find({
          where: { fseId: caresheet?.id },
        });
        if (!actMedical) {
          this.dentalEventTaskRepository.save(act);
        }
        caresheet.amount = act?.amount + caresheet?.amount;
        caresheet.amountAssure = caresheet?.amountAssure + act?.amount;
      });
      this.compute(caresheet);
      return await this.fseRepository.save({ ...caresheet });
    } catch (error) {
      // return (new ExceptionController($container -> get('twig'))) -> showAction($request, $e) -> send();
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }

  async compute(caresheet: FseEntity) {
    const groupByDates: any = {};
    caresheet.tasks.forEach((actMedical) => {
      const dateKey =
        actMedical && actMedical?.act?.date
          ? new Date(actMedical?.act?.date)
              .toISOString()
              .split('T')[0]
              .replace(/-/g, '')
          : '';
      if (!groupByDates[dateKey]) {
        groupByDates[dateKey] = [];
      }
      groupByDates[dateKey].push(actMedical);
    });
    for (const [key, groupByDate] of groupByDates) {
      if (groupByDate.length <= 1) continue;
      let associationCode = 4;
      const actMedicalCcams = groupByDate.filter((v) => v?.ccam);
      if (actMedicalCcams.length <= 1) continue;
      const actMedicalDemiTarifs: DentalEventTaskEntity[] =
        actMedicalCcams.filter((actMedical) => actMedical?.coefficient === 0.5);
      if (actMedicalDemiTarifs.length > 0) {
        associationCode = 1;
        this.add(actMedicalDemiTarifs, 2);
        const arrayUdiff = (arr1, arr2, compareFn) => {
          return arr1.filter((v1) => !arr2.some((v2) => compareFn(v1, v2)));
        };
        const compareLogic = (
          actMedical1: DentalEventTaskEntity,
          actMedical2: DentalEventTaskEntity,
        ) => {
          return actMedical1?.act?.id - actMedical2?.act?.id;
        };
        const actMedicalCcamss = arrayUdiff(
          actMedicalCcams,
          actMedicalDemiTarifs,
          compareLogic,
        );
        this.add(actMedicalCcamss, associationCode);
      } else if (actMedicalCcams.length === 2) {
        const ccam0 = actMedicalCcams[0]?.ccam;
        const ccam1 = actMedicalCcams[1]?.ccam;
        const rawCcam0 = await this.dataSource.query(
          `SELECT ccam_parent_id , ccam_child_id FROM ccam_association WHERE ccam_parent_id = ?`,
          [ccam0],
        );
        const rawCcam1 = await this.dataSource.query(
          `SELECT ccam_parent_id , ccam_child_id FROM ccam_association WHERE ccam_parent_id = ?`,
          [ccam1],
        );
        const dataCcam0 = rawCcam0.map((v) => v?.ccam_child_id);
        const dataCcam1 = rawCcam1.map((v) => v?.ccam_child_id);
        if (!dataCcam0.includes(ccam1) && !dataCcam1.includes(ccam0)) {
          this.add(actMedicalCcams, associationCode);
        }
      } else {
        this.add(actMedicalCcams, associationCode);
      }
    }
  }

  private async add(actMedicals: DentalEventTaskEntity[], associationCode = 4) {
    const promises = actMedicals.map((am) =>
      this.dentalEventTaskRepository.save({ id: am?.id, associationCode }),
    );
    await Promise.all(promises);
  }
}
