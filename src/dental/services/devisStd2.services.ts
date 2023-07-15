import { Injectable } from '@nestjs/common';
import { DataSource, In, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EnregistrerFactureDto } from '../dto/facture.dto';
import { BillEntity } from 'src/entities/bill.entity';
import { BillLineEntity } from 'src/entities/bill-line.entity';
import { MedicalHeaderEntity } from 'src/entities/medical-header.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { EventEntity } from 'src/entities/event.entity';
import { NgapKeyEntity } from 'src/entities/ngapKey.entity';
import { number } from 'yargs';
import { UserEntity } from 'src/entities/user.entity';
import {
  PrivilegeEntity,
  EnumPrivilegeTypeType,
} from 'src/entities/privilege.entity';
import { UserPreferenceQuotationEntity } from 'src/entities/user-preference-quotation.entity';
import { PlanPlfEntity } from 'src/entities/plan-plf.entity';
import { PlanEventEntity } from 'src/entities/plan-event.entity';
import { ContactEntity } from 'src/entities/contact.entity';

@Injectable()
export class DevisStd2Services {
  constructor(
    @InjectRepository(PlanPlfEntity)
    private planPlfRepository: Repository<PlanPlfEntity>,
    @InjectRepository(BillLineEntity)
    private billLineRepository: Repository<BillLineEntity>,
    @InjectRepository(MedicalHeaderEntity)
    private medicalHeaderRepository: Repository<MedicalHeaderEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(DentalEventTaskEntity)
    private dentalEventTaskRepository: Repository<DentalEventTaskEntity>, //dental
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>, //event
    @InjectRepository(NgapKeyEntity)
    private ngapKeyRepository: Repository<NgapKeyEntity>, //ngap_key
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PrivilegeEntity)
    private privilegeRepository: Repository<PrivilegeEntity>,
    @InjectRepository(UserPreferenceQuotationEntity)
    private userPreferenceQuotationRepository: Repository<UserPreferenceQuotationEntity>,
    @InjectRepository(PlanEventEntity)
    private planEventRepository: Repository<PlanEventEntity>, //event
    private dataSource: DataSource,
  ) {}

  async getInitChamps(userId, contactId, noPdt, noDevis, identity) {
    let idUser = identity?.id; //user id get to session
    let withs = userId; // id user to payload
    const type = EnumPrivilegeTypeType.NONE;
    if (withs !== null) {
      const privilege = await this.privilegeRepository.find({
        where: {
          usrId: idUser,
          usrWithId: In(withs),
          type: Not(type),
        },
      });
      if (privilege === null) {
        console.error(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      } else {
        idUser = withs;
      }
    }

    try {
      let userPreferenceQuotationColor: string;
      const userQuery = await this.userRepository.findOne({
        where: { id: idUser },
        relations: ['type', 'userPreferenceQuotation', 'address'],
      });
      const userType = userQuery?.type;
      const userPreferenceQuotationEntity = userQuery?.userPreferenceQuotation;
      if (userPreferenceQuotationEntity) {
        userPreferenceQuotationColor = userPreferenceQuotationEntity?.color;
      } else {
        userPreferenceQuotationColor = 'blue';
      }

      // const userSocialSecurityReimbursementRate =
      //   userQuery?.socialSecurityReimbursementRate;
      const userRateCharges = userQuery?.rateCharges;
      // const userSignature = userQuery?.signature;
      // const addressEntity = userQuery?.address;

      if (userType === null) {
        console.error(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      }

      if (!noPdt && !noDevis) {
        console.error(
          "Vous n'avez pas assez de privilège pour accéder aux factures",
        );
      }

      // let medical_entete_id = 0;
      const formatter = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const currentDate = new Date();
      const datedevisStd2 = formatter.format(currentDate);
      const titredevisStd2 = 'Devis pour traitement bucco-dentaire';

      let txch = 0;
      // let couleur = 'blue';
      // let schemas = 'both';
      // let quotationSignaturePatient = null;
      // let quotationSignaturePraticien = null;

      if (userRateCharges) {
        txch = userRateCharges >= 1 ? userRateCharges / 100 : userRateCharges;
      }
      const userConnectedPreferenceQuotationEntity =
        await this.userPreferenceQuotationRepository.findOneBy({
          usrId: identity?.id,
        });
      let userPreferenceQuotationDisplayTooltip: number;
      if (userConnectedPreferenceQuotationEntity) {
        userPreferenceQuotationDisplayTooltip =
          userConnectedPreferenceQuotationEntity?.displayTooltip;
      } else {
        userPreferenceQuotationDisplayTooltip = 1;
      }

      const year = currentDate.getFullYear();
      const dayOfYear = String(currentDate.getDate()).padStart(3, '0');

      // Assuming you have an asynchronous function named 'executeQuery' that performs the query
      let random = await this.dataSource.query(
        `
        SELECT COALESCE(SUBSTRING(MAX(reference), -5), 0) AS reference
         FROM T_DENTAL_QUOTATION_DQO
         WHERE USR_ID = ?
        AND reference LIKE CONCAT(?, ?, '%')`,
        [userQuery?.id, year, dayOfYear],
      );
      if (random === null || random === '') {
        random = 1;
      } else {
        random = parseInt(random) + 1;
      }
      // let reference = year + dayOfYear + '-' + String(random).padStart(5, '0');
    } catch {
      console.error(
        "Vous n'avez pas assez de privilège pour accéder aux factures",
      );
    }

    if (noPdt !== null) {
      // const planQuery = await this.planPlfRepository.findOne({relations:['events'],where:{id: noPdt}})
      // const event = await this.eventRepository.findOne({where:{planEvent: {id:planQuery?.events?.}}, relations:['planEvent']})
      // const planEvents = await this.planEventRepository.find({
      //   where:{plan:{id:noPdt,}},
      //   relations:['plan','event']

      // })
      const planQuery = await this.planPlfRepository
        ?.createQueryBuilder('plf')
        .select()
        .addSelect('plv')
        .addSelect('evt')
        .innerJoin(PlanEventEntity, 'plv')
        .innerJoin(EventEntity, 'evt')
        .innerJoin(ContactEntity, 'con')
        .where('plf.id:id', { id: noPdt })
        .andWhere('con.group:group', { group: identity?.org });

      console.log('------------data-------------', planQuery);
    }
  }
}
