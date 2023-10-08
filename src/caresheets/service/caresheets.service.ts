import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { subWeeks } from 'date-fns';
import axios from 'axios';
import * as AdmZip from 'adm-zip';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserEntity } from 'src/entities/user.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { ConfigService } from '@nestjs/config';
import { CaresheetStatusEntity } from 'src/entities/caresheet-status.entity';
import { RequestException } from 'src/common/exceptions/request-exception.exception';
import {
  EnumThirdPartyStatus,
  ThirdPartyAmcEntity,
} from 'src/entities/third-party-amc.entity';
import { ThirdPartyAmoEntity } from 'src/entities/third-party-amo.entity';
import { CaresheetModeEnum } from 'src/enum/caresheet.enum';
import { CaresheetTypeEnum } from 'src/enum/caresheet-type.enum';
import {
  CaresheetRes,
  CaresheetStatusRes,
  CaresheetThirdPartyRes,
} from '../reponse/index.res';
import { SesamvitaleTeletranmistionService } from './sesamvitale-teletranmistion.service';
import * as path from 'path';
import { PrintPDFOptions, customCreatePdf } from 'src/common/util/pdf';
import * as dayjs from 'dayjs';
import { LotEntity } from 'src/entities/lot.entity';
import { checkBoolean, checkId } from 'src/common/util/number';
import { CurrencyEnum } from 'src/constants/currency';
import { SuccessResponse } from 'src/common/response/success.res';
import { associatifToSequential } from 'src/common/util/array';
import { PatientAmcEntity } from 'src/entities/patient-amc.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { PatientService } from 'src/patient/service/patient.service';
import { ContactUserEntity } from 'src/entities/contact-user.entity';
import { helpersCaresheetPdf, optionsCaresheetPdf } from '../utils/pdf';
const PDFMerger = require('pdf-merger-js');

@Injectable()
export class ActsService {
  private readonly logger: Logger = new Logger(ActsService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(FseEntity)
    private fseRepository: Repository<FseEntity>,
    @InjectRepository(CaresheetStatusEntity)
    private caresheetStatusRepository: Repository<CaresheetStatusEntity>,
    @InjectRepository(ThirdPartyAmcEntity)
    private thirdPartyAmcRepository: Repository<ThirdPartyAmcEntity>,
    @InjectRepository(ThirdPartyAmoEntity)
    private thirdPartyAmoRepository: Repository<ThirdPartyAmoEntity>,
    @InjectRepository(DentalEventTaskEntity)
    private dentalEventTaskRepository: Repository<DentalEventTaskEntity>,
    private sesamvitaleTeletranmistionService: SesamvitaleTeletranmistionService,
    @InjectRepository(LotEntity)
    private lotRepository: Repository<LotEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
    @InjectRepository(ContactUserEntity)
    private contactUserRepository: Repository<ContactUserEntity>,
    private patientService: PatientService,
  ) {}

  async sendRequest(action: string, contents: string): Promise<any> {
    const endpoint = await this.configService.get('app.sesamVitale.endPoint');
    const url = `${endpoint}/webservices/Fsv_SesamVitale.asmx`;

    const headers = {
      'Content-Type': 'text/xml; charset=utf-8',
    };

    const response = await axios.post(url, contents, { headers });

    const body = response.data.replace(/(<\/?)(\w+):([^>]*>)/g, '$1$2$3'); // Strip the namespaces
    const xml = new DOMParser().parseFromString(body, 'text/xml');
    const result =
      xml.getElementsByTagName('soapBody')[0][`${action}Response`][
        `${action}Result`
      ];

    if (result.erreur && result.erreur.libelleErreur) {
      throw new RequestException(result.erreur.libelleErreur, response);
    }

    const resultToArray = JSON.parse(
      JSON.stringify(result).replace(/:\{\}/g, ':null'),
    );

    // Modifie le type de certaines valeurs
    // array_walk_recursive($resultToArray, array($this, 'cast'));

    return resultToArray;
  }

  /**
   * php/caresheets/show.php
   */
  async show(id: number) {
    const caresheet: FseEntity = await this.fseRepository.findOne({
      where: { id },
      relations: ['fseStatus', 'patient', 'lots', 'rejections'],
    });
    const thirdPartyAmcs = await this.thirdPartyAmcRepository.find({
      relations: ['amc'],
    });
    const thirdPartyAmos = await this.thirdPartyAmoRepository.find({
      relations: ['amo'],
    });
    const thirdPartyAmc = thirdPartyAmcs.find(
      (tp) => tp.caresheetId === caresheet?.id,
    );
    const thirdPartyAmo = thirdPartyAmos.find(
      (tp) => tp.caresheetId === caresheet?.id,
    );
    const data: CaresheetThirdPartyRes = {
      id: caresheet?.id,
      mode: caresheet?.mode,
      mode_readable: caresheet?.mode
        ? CaresheetModeEnum.choices[caresheet?.mode]
        : '',
      number: caresheet?.nbr,
      type: caresheet?.type,
      type_readable: caresheet?.type
        ? CaresheetTypeEnum.choices[caresheet?.type]
        : '',
      tiers_payant: !!caresheet?.tiersPayant,
      tiers_payant_status: caresheet?.tiersPayantStatus,
      amount: caresheet?.amount,
      amount_amc: caresheet?.amountAMC,
      amount_amo: caresheet?.amountAMO,
      amount_patient: caresheet?.amountAssure,
      creation_date: caresheet?.date,
      electronic_caresheet: !!caresheet?.electronicCaresheet,
      third_party_amount: caresheet?.thirdPartyAmount,
      third_party_amount_paid: caresheet?.thirdPartyAmountPaid,
      third_party_amount_remaining:
        caresheet?.thirdPartyAmount && caresheet?.thirdPartyAmountPaid
          ? caresheet?.thirdPartyAmount - caresheet?.thirdPartyAmountPaid
          : 0,
      lots: caresheet?.lots,
      rejections: caresheet?.rejections,
      fse_status: caresheet?.fseStatus,
    };

    if (thirdPartyAmc && thirdPartyAmc?.amc) {
      data.third_party_amc = {
        id: thirdPartyAmc?.id,
        is_dre: !!thirdPartyAmc?.isDre,
        status: thirdPartyAmc?.status,
        amount: thirdPartyAmc?.amount,
        amount_care: thirdPartyAmc?.amountCare,
        amount_care_paid: thirdPartyAmc?.amountCarePaid,
        amount_care_remaining:
          thirdPartyAmc?.amountCare && thirdPartyAmc?.amountCarePaid
            ? thirdPartyAmc?.amountCare - thirdPartyAmc?.amountCarePaid
            : 0,
        amount_paid: thirdPartyAmc?.amountPaid,
        amount_paid_manually: thirdPartyAmc?.amountPaidManually,
        amount_paid_noemie: thirdPartyAmc?.amountPaidNoemie,
        amount_prosthesis: thirdPartyAmc?.amountProsthesis,
        amount_prosthesis_paid: thirdPartyAmc?.amountProsthesisPaid,
        amount_prosthesis_remaining:
          thirdPartyAmc?.amountProsthesis && thirdPartyAmc?.amountProsthesisPaid
            ? thirdPartyAmc?.amountProsthesis -
              thirdPartyAmc?.amountProsthesisPaid
            : 0,
        amount_remaining:
          thirdPartyAmc?.amount && thirdPartyAmc?.amountPaid
            ? thirdPartyAmc?.amount - thirdPartyAmc?.amountPaid
            : 0,
        amc: {
          id: thirdPartyAmc?.amc?.id,
          is_gu: !!thirdPartyAmc?.amc?.isGu,
          libelle: thirdPartyAmc?.amc?.libelle,
          numero: thirdPartyAmc?.amc?.numero,
        },
      };
    }

    if (thirdPartyAmo && thirdPartyAmo?.amo) {
      data.third_party_amo = {
        id: thirdPartyAmo?.id,
        status: thirdPartyAmo?.status,
        amount: thirdPartyAmo?.amount,
        amount_care: thirdPartyAmo?.amountCare,
        amount_care_paid: thirdPartyAmo?.amountCarePaid,
        amount_care_remaining:
          thirdPartyAmo?.amountCare && thirdPartyAmo?.amountCarePaid
            ? thirdPartyAmo?.amountCare - thirdPartyAmo?.amountCarePaid
            : 0,
        amount_paid: thirdPartyAmo?.amountPaid,
        amount_paid_manually: thirdPartyAmo?.amountPaidManually,
        amount_paid_noemie: thirdPartyAmo?.amountPaidNoemie,
        amount_prosthesis: thirdPartyAmo?.amountProsthesis,
        amount_prosthesis_paid: thirdPartyAmo?.amountProsthesisPaid,
        amount_prosthesis_remaining:
          thirdPartyAmo?.amountProsthesis && thirdPartyAmo?.amountProsthesisPaid
            ? thirdPartyAmo?.amountProsthesis -
              thirdPartyAmo?.amountProsthesisPaid
            : 0,
        amount_remaining:
          thirdPartyAmo?.amount && thirdPartyAmo?.amountPaid
            ? thirdPartyAmo?.amount - thirdPartyAmo?.amountPaid
            : 0,
        amo: {
          id: thirdPartyAmo?.amo?.id,
          libelle: thirdPartyAmo?.amo?.libelle,
          caisse_gestionnaire: thirdPartyAmo?.amo?.caisseGestionnaire,
          centre_gestionnaire: thirdPartyAmo?.amo?.centreGestionnaire,
          centre_informatique: thirdPartyAmo?.amo?.centreInformatique,
          code_national: thirdPartyAmo?.amo?.codeNational,
          grand_regime: thirdPartyAmo?.amo?.grandRegime,
          organisme_destinataire: thirdPartyAmo?.amo?.organismeDestinataire,
          numero: thirdPartyAmc?.amc?.numero,
        },
      };
    }
    if (caresheet?.patient) {
      data.patient = {
        id: caresheet?.patient?.id,
        first_name: caresheet?.patient?.firstname,
        last_name: caresheet?.patient?.lastname,
        full_name: `${caresheet?.patient?.lastname ?? ''} ${
          caresheet?.patient?.firstname ?? ''
        }`,
        email: caresheet?.patient?.email,
        birth_rank: caresheet?.patient?.birthOrder,
        number: caresheet?.patient?.nbr,
        amcs: caresheet?.patient?.amcs ?? [],
        amos: caresheet?.patient?.amos ?? [],
        patient_users: caresheet?.patient?.patientUsers ?? [],
        phone_numbers: caresheet?.patient?.phoneNumbers ?? [],
      };
    }
    return data;
  }

  async getUserCaresheet(
    userId: number,
    page: number,
    size: number,
    filterParams?: string[],
    filterValues?: string[],
  ) {
    const _take = size || 25;
    const _skip = page ? (page - 1) * _take : 0;
    const user = await this.userRepository.findOne({
      where: { id: checkId(userId) || 0 },
    });
    if (!user) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_USER);
    }

    const queryBuilder = this.fseRepository.createQueryBuilder('caresheet');
    queryBuilder
      .leftJoinAndSelect('caresheet.lots', 'lot')
      .leftJoinAndSelect('caresheet.patient', 'patient')
      .leftJoinAndSelect('caresheet.fseStatus', 'fseStatus')
      .leftJoinAndSelect('caresheet.dreStatus', 'dreStatus')
      .andWhere('caresheet.usrId = :id', { id: user?.id })
      .andWhere('caresheet.electronicCaresheet = 1');

    for (let i = 0; i < filterParams?.length; i++) {
      const filterParam = filterParams[i];
      const filterValue = filterValues[i];

      switch (filterParam) {
        case 'caresheet.mode':
          queryBuilder.andWhere('caresheet.mode = :mode', {
            mode: filterValue,
          });
          break;

        case 'caresheet.creationDate':
          queryBuilder.andWhere('caresheet.date = :creationDate', {
            creationDate: filterValue,
          });
          break;

        case 'caresheet.number':
          queryBuilder.andWhere('caresheet.nbr = LPAD(:number, 9, 0)', {
            number: filterValue,
          });
          break;

        case 'lot.number':
          queryBuilder.andWhere('lot.number = LPAD(:lotNumber, 3, 0)', {
            lotNumber: filterValue,
          });
          break;

        case 'fseStatus.id':
          queryBuilder.andWhere('fseStatus.id = :fseStatus', {
            fseStatus: filterValue,
          });
          break;

        case 'dreStatus.id':
          queryBuilder.andWhere('dreStatus.id = :dreStatus', {
            dreStatus: filterValue,
          });
          break;

        case 'patient.fullName':
          queryBuilder.andWhere(
            'patient.lastname LIKE :patient OR patient.firstname LIKE :patient',
            {
              patient: `%${filterValue}%`,
            },
          );
          break;
      }
    }
    queryBuilder
      .orderBy('caresheet.date', 'DESC')
      .addOrderBy('caresheet.nbr', 'DESC')
      .skip(_skip)
      .take(_take);
    const result = await queryBuilder.getManyAndCount();
    const items = result[0].map((item) => {
      const res: CaresheetRes = {
        ...item,
        electronicCaresheet: Boolean(item.electronicCaresheet),
        tiersPayant: Boolean(item.tiersPayant),
        tiersPayantStatus: Boolean(item.tiersPayantStatus),
      };
      return res;
    });
    return {
      current_page_number: page,
      num_items_per_page: _take,
      custom_parameters: { sorted: true },
      items: items,
      total_count: result[1],
      paginator_options: {
        defaultSortDirection: 'desc',
        defaultSortFieldName: 'caresheet.creationDate+caresheet.number',
        distinct: false,
        filterFieldParameterName: 'filterParam',
        filterValueParameterName: 'filterValue',
        pageParameterName: 'page',
        sortDirectionParameterName: 'direction',
        sortFieldParameterName: 'sort',
      },
    };
  }

  async getAllCaresheetStatus(): Promise<CaresheetStatusRes[]> {
    return await this.caresheetStatusRepository.find();
  }

  /**
   * sesam-vitale/caresheets/update.php
   * 16-61
   */
  async update(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new CBadRequestException(ErrorCode.ERROR_GET_USER);
    }

    const startDatetime = subWeeks(Date.now(), 2);

    const caresheets = await this.fseRepository
      .createQueryBuilder('caresheet')
      .where('caresheet.usrId = :id', { id })
      .andWhere('caresheet.externalReferenceId IS NOT NULL')
      .andWhere('caresheet.date >= :creationDate', {
        creationDate: startDatetime,
      })
      .getMany();

    for (const caresheet of caresheets) {
      const facture =
        await this.sesamvitaleTeletranmistionService.consulterFacture(
          caresheet.externalReferenceId,
        );
      const fseStatus = await this.caresheetStatusRepository.findOne({
        where: {
          value: Number(facture.etatLotFse?.[0]),
        },
      });
      if (fseStatus) {
        caresheet.fseStatus = fseStatus;
      }
      const dreStatus = await this.caresheetStatusRepository.findOne({
        where: { value: Number(facture.etatLotDre?.[0]) },
      });
      if (dreStatus) {
        caresheet.dreStatus = dreStatus;
      }
      await this.fseRepository.save(caresheet);
    }
  }

  async getCaresheetFileById(
    id: number,
    duplicata?: boolean,
  ): Promise<{ file: Buffer; name: string }> {
    const caresheet = await this.fseRepository.findOne({
      where: { id },
      relations: {
        actMedicals: {
          act: true,
          ccam: true,
          ngapKey: true,
        },
        amo: true,
        amc: true,
        patient: {
          medical: {
            policyHolder: true,
          },
        },
      },
    });
    caresheet.thirdPartyAmo = await this.thirdPartyAmoRepository.findOne({
      where: {
        caresheetId: caresheet?.id,
      },
    });
    caresheet.thirdPartyAmc = await this.thirdPartyAmcRepository.findOne({
      where: {
        caresheetId: caresheet?.id,
      },
    });
    const filePath = path.join(
      process.cwd(),
      'templates/pdf/caresheets',
      'duplicata.hbs',
    );
    const data = {
      caresheet,
      duplicata,
    };
    const pdf = await customCreatePdf({
      files: [{ path: filePath, data }],
      options: optionsCaresheetPdf,
      helpers: helpersCaresheetPdf,
    });
    return {
      file: pdf,
      name: `${caresheet.nbr}.pdf`,
    };
  }

  async getListLotByIds(ids: Array<number>): Promise<LotEntity[]> {
    const queryBuilder = this.lotRepository
      .createQueryBuilder('lot')
      .distinct()
      .leftJoinAndSelect('lot.amc', 'amc')
      .leftJoinAndSelect('lot.amo', 'amo')
      .innerJoinAndSelect('lot.caresheets', 'caresheets')
      .innerJoinAndSelect('caresheets.patient', 'patients')
      .where('caresheets.id IN (:id)', { id: ids });

    const lots = await queryBuilder.getMany();
    return lots;
  }

  async getLotFile(
    lot: LotEntity,
    user: UserEntity,
  ): Promise<{ file: Buffer; name: string }> {
    const filePath = path.join(
      process.cwd(),
      'templates/pdf/lot',
      'bordereau_teletransmission.hbs',
    );

    const data = {
      lot,
      user,
      currencyy: CurrencyEnum[user?.preference?.currency ?? 'EUR'],
      count: lot?.caresheets?.length,
    };

    const pdf = await customCreatePdf({
      files: [{ path: filePath, data }],
      options: optionsCaresheetPdf,
      helpers: helpersCaresheetPdf,
    });
    return {
      file: pdf,
      name: `${lot.number}.pdf`,
    };
  }

  async print(userId: number, ids: Array<number>, duplicata?: boolean) {
    try {
      const merger = new PDFMerger();
      for (const id of ids) {
        const { file } = await this.getCaresheetFileById(id, duplicata);
        await merger.add(file);
      }
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['medical', 'medical.specialtyCode', 'preference'],
      });
      const lots: LotEntity[] = await this.getListLotByIds(ids);

      for (const lot of lots) {
        const { file } = await this.getLotFile(lot, user);
        await merger.add(file);
      }
      return await merger.saveAsBuffer();
    } catch (error) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async printLotBordereau(id: number, user_id: number) {
    const queryBuilder = this.lotRepository
      .createQueryBuilder('lot')
      .distinct()
      .leftJoinAndSelect('lot.amc', 'amc')
      .leftJoinAndSelect('lot.amo', 'amo')
      .innerJoinAndSelect('lot.caresheets', 'caresheets')
      .innerJoinAndSelect('caresheets.patient', 'patients')
      .where('lot.id  = :id', { id: id });

    const lot = await queryBuilder.getOne();

    const user = await this.userRepository.findOne({
      where: { id: user_id },
      relations: ['medical', 'medical.specialtyCode', 'preference'],
    });
    return (await this.getLotFile(lot, user)).file;
  }

  async duplicata(id: number, duplicata: boolean) {
    const result = await this.getCaresheetFileById(id, checkBoolean(duplicata));
    return result.file;
  }

  async download(userId: number, ids: Array<number>, duplicata?: boolean) {
    const zip = new AdmZip();

    for (const id of ids) {
      const { file, name } = await this.getCaresheetFileById(id, duplicata);
      zip.addFile(name, file);
    }
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['medical', 'medical.specialtyCode'],
    });
    const lots: LotEntity[] = await this.getListLotByIds(ids);
    for (const lot of lots) {
      const { file, name } = await this.getLotFile(lot, user);
      zip.addFile(name, file);
    }
    return zip.toBuffer();
  }

  async deleteCaresheet(id: number): Promise<SuccessResponse> {
    try {
      const caresheet = await this.fseRepository.findOne({
        where: { id: id },
        relations: {
          tasks: {
            act: true,
          },
        },
      });
      if (!caresheet) {
        throw new CBadRequestException(ErrorCode.FILE_NOT_FOUND);
      }
      if (caresheet?.tasks) {
        caresheet?.tasks.forEach(async (actMedicals) => {
          actMedicals.act.status = 1;
          await this.eventTaskRepository.save(actMedicals.act);
        });
      }
      await this.fseRepository.delete({ id });

      return { success: true };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
    }
  }

  async updateCaresheet(id: number) {
    try {
      const caresheet: FseEntity = await this.fseRepository.findOne({
        where: { id },
        relations: {
          actMedicals: {
            act: true,
            ccam: true,
            ngapKey: true,
          },
          amo: true,
          amc: true,
          patient: {
            medical: {
              policyHolder: true,
            },
            amos: {
              amo: true,
            },
            amcs: {
              amc: true,
            },
          },
        },
      });
      const facture =
        await this.sesamvitaleTeletranmistionService.consulterFacture(
          caresheet?.externalReferenceId,
        );
      let amount = 0;
      let amountPatient = 0;
      let amountAmo = 0;
      let amountAmoCare = 0;
      let amountAmoProsthesis = 0;
      let amountAmc = 0;
      let amountAmcCare = 0;
      let amountAmcProsthesis = 0;
      let patientUser: ContactUserEntity;
      const prestations = associatifToSequential(facture?.prestations);
      if (prestations && prestations.length > 0) {
        for (const prestation of prestations) {
          const montantAMO = parseFloat(prestation?.[0]?.montantAMO?.[0]);
          const montantAMC = parseFloat(prestation?.[0]?.montantAMC?.[0]);
          amount += parseFloat(prestation?.[0]?.montantTotal?.[0]);
          amountPatient += parseFloat(prestation?.[0]?.montantPP?.[0]);
          amountAmo += montantAMO;
          amountAmc += montantAMC;
        }
      }

      const amoList = this.getActiveAmo(
        caresheet?.patient?.amos,
        new Date(caresheet?.date),
      );
      const activeAmo = amoList?.[0];
      const amcList = this.getActiveAmc(
        caresheet?.patient?.amcs,
        new Date(caresheet?.date),
      );
      const activeAmc = amcList?.[0];
      const amo = activeAmo?.amo ? activeAmo?.amo : null;
      const amc = activeAmc?.amc ? activeAmc?.amc : null;

      caresheet.amoId = amo?.id;
      caresheet.amcId = amc?.id;

      // Comment for check later
      // caresheet.amo = amo;
      // caresheet.amc = amc;

      caresheet.nbr =
        typeof facture?.numeroFse?.[0] === 'string'
          ? String(facture?.numeroFse?.[0]).padStart(9, '0')
          : facture?.numeroFse?.[0];
      const fseStatus = await this.caresheetStatusRepository.findOne({
        where: {
          value: Number(facture.etatLotFse?.[0]),
        },
      });
      if (fseStatus) {
        caresheet.fseStatus = fseStatus;
      }
      const dreStatus = await this.caresheetStatusRepository.findOne({
        where: { value: Number(facture.etatLotDre?.[0]) },
      });
      if (dreStatus) {
        caresheet.dreStatus = dreStatus;
      }

      caresheet.mode = facture?.modeFacture?.[0];
      caresheet.type = facture?.typeFacture?.[0];
      caresheet.amount = amount;
      caresheet.amountAMO = amountAmo;
      caresheet.amountAMC = amountAmc;
      caresheet.amountAssure = amountPatient;

      for (const actMedicals of caresheet?.actMedicals) {
        const code = actMedicals?.ccam
          ? actMedicals?.ccam?.code
          : actMedicals?.ngapKey?.name;

        for (const prestation of prestations) {
          const presentationCode = prestation?.[0]?.codesActes?.[0].code?.[0];
          const prestationMontantTotal = prestation?.[0]?.montantTotal?.[0];
          if (presentationCode === code && prestationMontantTotal === amount) {
            actMedicals.secuRepayment = prestation?.[0]?.montantAMO?.[0];
            actMedicals.mutualRepayment = prestation?.[0]?.montantAMC?.[0];
            actMedicals.personAmount = prestation?.[0]?.montantPP?.[0];

            await this.dentalEventTaskRepository.save(actMedicals);

            const ccamFamily = actMedicals?.act?.ccamFamily;
            if (ccamFamily && this.isProsthesis(ccamFamily)) {
              amountAmoProsthesis += parseFloat(
                prestation?.[0]?.montantAMO?.[0] || 0,
              );
              amountAmcProsthesis += parseFloat(
                prestation?.[0]?.montantAMC?.[0] || 0,
              );
            } else {
              amountAmoCare += parseFloat(
                prestation?.[0]?.montantAMO?.[0] || 0,
              );
              amountAmcCare += parseFloat(
                prestation?.[0]?.montantAMC?.[0] || 0,
              );
            }
            break;
          }
        }
      }
      const amoIsTp = facture?.AMO?.[0].isTp?.[0];
      const amcIsTp = facture?.AMC?.[0].isTp?.[0];
      if (amoIsTp && amountAmo) {
        const thirdPartyAmo = new ThirdPartyAmoEntity();
        thirdPartyAmo.userId = caresheet?.usrId;
        thirdPartyAmo.patientId = caresheet?.conId;
        // thirdPartyAmo.amo = caresheet?.amo;
        // thirdPartyAmo.amoId = caresheet?.amo?.id;
        thirdPartyAmo.amoId = amo?.id;
        thirdPartyAmo.amount = amountAmo;
        thirdPartyAmo.amountCare = amountAmoCare;
        thirdPartyAmo.amountProsthesis = amountAmoProsthesis;
        caresheet.tiersPayant = 1;
        caresheet.tiersPayantStatus = EnumThirdPartyStatus.WAITING;

        const amountThirdParty =
          Number(caresheet?.thirdPartyAmount) + amountAmo;
        caresheet.thirdPartyAmount = amountThirdParty;
        caresheet.thirdPartyAmo = thirdPartyAmo;

        if (thirdPartyAmo.patientId && thirdPartyAmo.userId) {
          patientUser = await this.patientService.getPatientUser(
            thirdPartyAmo?.userId,
            thirdPartyAmo?.patientId,
          );
          patientUser.amount =
            Number(patientUser?.amount) - Number(thirdPartyAmo?.amount);
          patientUser.amountCare =
            Number(patientUser?.amountCare) - Number(thirdPartyAmo?.amountCare);
          patientUser.amountProsthesis =
            Number(patientUser?.amountProsthesis) -
            Number(thirdPartyAmo?.amountProsthesis);

          patientUser.thirdPartyBalance =
            Number(patientUser?.thirdPartyBalance) +
            Number(thirdPartyAmo?.amount);

          thirdPartyAmo.caresheetId = caresheet.id;
          await this.thirdPartyAmoRepository.save({ ...thirdPartyAmo });
          await this.contactUserRepository.save({ ...patientUser });
        }
      }
      if (amcIsTp && amountAmc) {
        const thirdPartyAmc = new ThirdPartyAmcEntity();
        thirdPartyAmc.userId = caresheet?.usrId;
        thirdPartyAmc.patientId = caresheet?.conId;
        // thirdPartyAmc.amc = caresheet?.amc;
        thirdPartyAmc.amcId = amc?.id;
        thirdPartyAmc.amount = amountAmc;
        thirdPartyAmc.amountCare = amountAmcCare;
        thirdPartyAmc.amountProsthesis = amountAmcProsthesis;

        const typeFacture = facture.typeFacture?.[0];
        typeFacture == 'FDE'
          ? (thirdPartyAmc.isDre = 1)
          : (thirdPartyAmc.isDre = 0);
        caresheet.tiersPayant = 1;
        caresheet.tiersPayantStatus = EnumThirdPartyStatus.WAITING;
        const amountThirdParty = Number(caresheet.thirdPartyAmount) + amountAmc;
        caresheet.thirdPartyAmount = amountThirdParty;
        caresheet.thirdPartyAmc = thirdPartyAmc;

        if (thirdPartyAmc.patientId && thirdPartyAmc.userId) {
          const patientUser = await this.patientService.getPatientUser(
            thirdPartyAmc.userId,
            thirdPartyAmc.patientId,
          );
          patientUser.amount =
            Number(patientUser?.amount) - Number(thirdPartyAmc?.amount);
          patientUser.amountCare =
            Number(patientUser?.amountCare) - Number(thirdPartyAmc?.amountCare);
          patientUser.amountProsthesis =
            Number(patientUser?.amountProsthesis) -
            Number(thirdPartyAmc?.amountProsthesis);
          patientUser.thirdPartyBalance =
            Number(patientUser?.thirdPartyBalance) +
            Number(thirdPartyAmc?.amount);
          thirdPartyAmc.caresheetId = caresheet.id;
          await this.thirdPartyAmcRepository.save({ ...thirdPartyAmc });

          await this.contactUserRepository.save({ ...patientUser });
        }
      }

      const fseSave = await this.fseRepository.save({ ...caresheet });
      await Promise.all(
        caresheet?.actMedicals.map((item) => {
          return this.dentalEventTaskRepository.save({
            ...item,
            fseId: fseSave?.id,
          });
        }),
      );
      return await this.fseRepository.findOne({
        where: { id: fseSave?.id },
        relations: { patient: true },
      });
    } catch (error) {
      console.log('error', error);
    }
  }

  isProsthesis(family: string): boolean {
    /**
     * @var array liste des codes de regroupement de prothèses
     */
    const PROSTHESIS_FAMILIES = [
      'BR1',
      'CM0',
      'CT0',
      'CT1',
      'CZ0',
      'CZ1',
      'IC0',
      'IC1',
      'ICO',
      'IMP',
      'IN1',
      'INO',
      'PA0',
      'PA1',
      'PAM',
      'PAR',
      'PDT',
      'PF0',
      'PF1',
      'PFC',
      'PFM',
      'PT0',
      'RA0',
      'RE1',
      'RF0',
      'RPN',
      'RS0',
      'SU0',
      'SU1',
    ];
    return PROSTHESIS_FAMILIES.includes(family);
  }

  private getActiveAmo = (amos: PatientAmoEntity[], date: Date) => {
    return amos.filter((amo) => {
      return (
        (amo?.startDate === null || dayjs(amo?.startDate).isBefore(date)) &&
        (amo?.endDate === null || dayjs(amo?.endDate).isAfter(dayjs(date)))
      );
    });
  };
  async getQuittanceFile(id: number): Promise<{ file: Buffer; name: string }> {
    const caresheet = await this.fseRepository.findOne({
      where: { id },
      relations: {
        tasks: {
          act: true,
          ccam: true,
          ngapKey: true,
        },
        amo: true,
        amc: true,
        patient: {
          medical: {
            policyHolder: true,
          },
        },
        user: {
          medical: {
            specialtyCode: true,
          },
          address: true,
        },
      },
    });

    if (caresheet?.tasks) {
      caresheet.tasks = caresheet?.tasks?.map((dentalEventTask) => {
        return {
          ...dentalEventTask,
          teethArr: dentalEventTask?.teeth?.includes(',')
            ? dentalEventTask?.teeth?.split(',')
            : [dentalEventTask?.teeth],
        };
      });
    }

    caresheet.thirdPartyAmo = await this.thirdPartyAmoRepository.findOne({
      where: {
        caresheetId: caresheet?.id,
      },
    });

    caresheet.thirdPartyAmc = await this.thirdPartyAmcRepository.findOne({
      where: {
        caresheetId: caresheet?.id,
      },
    });
    const filePath = path.join(
      process.cwd(),
      'templates/pdf/caresheets',
      'quittance.hbs',
    );

    const data = {
      caresheet,
      currencyy: CurrencyEnum[caresheet?.user.setting?.currency ?? 'EUR'],
    };

    const pdf = await customCreatePdf({
      files: [{ path: filePath, data }],
      options: optionsCaresheetPdf,
      helpers: helpersCaresheetPdf,
    });
    return {
      file: pdf,
      name: `${caresheet.nbr}.pdf`,
    };
  }
  async printQuittance(id: number) {
    const merger = new PDFMerger();
    const { file } = await this.getQuittanceFile(id);
    await merger.add(file);
    return await merger.saveAsBuffer();
  }

  private getActiveAmc = (amcs: PatientAmcEntity[], date: Date) => {
    return amcs.filter((amc) => {
      return (
        (amc?.startDate === null || dayjs(amc?.startDate).isBefore(date)) &&
        (amc?.endDate === null || dayjs(amc?.endDate).isAfter(dayjs(date)))
      );
    });
  };
}
