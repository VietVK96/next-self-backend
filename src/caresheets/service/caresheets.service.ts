import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { format, isAfter, isBefore, subWeeks } from 'date-fns';
import { create } from 'xmlbuilder2';
import axios from 'axios';
import * as AdmZip from 'adm-zip';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from '../../entities/contact.entity';
import { CaresheetsDto } from '../dto/index.dto';
import { FseEntity } from 'src/entities/fse.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { InterfacageService } from 'src/interfacage/services/interfacage.service';
import { CodeNatureAssuranceEnum, ExceedingEnum } from 'src/constants/act';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { ExemptionCodeEnum } from 'src/enum/exemption-code.enum';
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
import { customCreatePdf } from 'src/common/util/pdf';
import * as dayjs from 'dayjs';
import { LotEntity } from 'src/entities/lot.entity';
import { checkBoolean, checkId } from 'src/common/util/number';
import { CurrencyEnum } from 'src/constants/currency';
import { SuccessResponse } from 'src/common/response/success.res';
import { associatifToSequential } from 'src/common/util/array';
import { PatientAmcEntity } from 'src/entities/patient-amc.entity';
const PDFMerger = require('pdf-merger-js');

const PAV_AUTHORIZED_CODES = ['ACO', 'ADA', 'ADC', 'ADE', 'ATM'];
const PAV_MINIMUM_AMOUNT = 120;
const helpersCaresheetPdf = {
  formatDate: function (date: string) {
    return dayjs(date).format('DDMMYYYY');
  },
  formatInsee: function (s1, s2) {
    let string = s1?.concat(s2 ?? '');
    if (!string) return '';
    string = string?.replace(/\W/g, '')?.toUpperCase();
    return string?.replace(
      /(\w{1})(\w{2})(\w{2})(\w{2})(\w{3})(\w{3})(\w{2})/,
      '$1 $2 $3 $4 $5 $6 $7',
    );
  },
  formatDateISO: function (date) {
    return dayjs(date).format('DD/MM/YYYY');
  },
  slice: function (string, start, end) {
    if (!string) return;
    return string.toString().slice(start, end);
  },
  padStart: function (value, num) {
    if (!value) return;
    return value.padStart(num, '');
  },
  padEnd: function (value, num) {
    if (!value) return;
    return value.padEnd(num, '');
  },
  joinAndReplace: function (string, key, value) {
    if (!string) return;
    return string.join('').replace(key, value);
  },
  setVar: function (varName, varValue, options) {
    options.data.root[varName] = varValue;
  },
  concatString: function (s1, s2) {
    return s1.concat(s2);
  },
  math: function (lvalue, operator, rvalue) {
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);
    return {
      '+': lvalue + rvalue,
      '-': lvalue - rvalue,
      '*': lvalue * rvalue,
      '/': lvalue / rvalue,
      '%': lvalue % rvalue,
    }[operator];
  },
  table: function (context) {
    if (!context) return;
    const listItem = context.toString().split('');
    const width = Math.floor(100 / listItem.length);
    let str = `
    <table class="text-center">
      <tbody>
        <tr>`;
    for (let i = 0, j = listItem.length; i < j; i++) {
      str += `<td style="width: ${width}%;">${listItem[i]}</td>`;
    }
    str += `
        </tr>
      </tbody>
    </table>`;
    return str;
  },
  nameToTransmit: (key) => {
    return key === 'CBX' ? 'CCX' : key;
  },
  formatNumber: (n: number) => {
    return Number(n).toFixed(2);
  },
};
const optionsCaresheetPdf = {
  format: 'A4',
  displayHeaderFooter: true,
  landscape: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div></div>',
  margin: {
    left: '10mm',
    top: '25mm',
    right: '10mm',
    bottom: '15mm',
  },
};
@Injectable()
export class ActsService {
  private readonly logger: Logger = new Logger(ActsService.name);

  constructor(
    private configService: ConfigService,
    private dataSource: DataSource,
    private interfacageService: InterfacageService,
    @InjectRepository(ContactEntity)
    private patientRepository: Repository<ContactEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(FseEntity)
    private fseRepository: Repository<FseEntity>,
    @InjectRepository(EventTaskEntity)
    private eventTaskRepository: Repository<EventTaskEntity>,
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
  ) {}

  /**
   * php/caresheets/store.php
   */
  async store(request: CaresheetsDto) {
    try {
      const {
        patient_id,
        user_id,
        act_id,
        is_tp_amo,
        is_tp_amc,
        prescripteur,
        date_prescription,
        situation_parcours_de_soin,
        nom_medecin_orienteur,
        prenom_medecin_orienteur,
        related_ald,
        date_demande_prealable,
        code_accord_prealable,
        // suite_exp,
        generer_dre,
      } = request;
      const [patient, user] = await Promise.all([
        this.patientRepository.findOneOrFail({
          relations: { amos: true },
          where: { id: patient_id },
        }),
        this.userRepository.findOneOrFail({
          relations: { medical: true },
          where: { id: user_id },
        }),
      ]);
      const acts: EventTaskEntity[] = await this.eventTaskRepository.find({
        relations: { medical: { act: true, ccam: { family: true } } },
        where: { id: In(act_id), conId: patient_id },
      });
      if (acts?.length === 0) {
        throw new CBadRequestException(ErrorCode.ERROR_CARESHEET_ACTS_IS_EMPTY);
      }
      const caresheet: FseEntity = {};
      caresheet.usrId = user?.id;
      caresheet.conId = patient?.id;
      caresheet.numeroFacturation = user?.medical?.finessNumber;
      caresheet.date = dayjs().format('YYYY-MM-dd');
      caresheet.tasks = [];
      caresheet.fseStatus = await this.caresheetStatusRepository.findOne({
        where: { value: 0 },
      });
      caresheet.dreStatus = caresheet.fseStatus;
      acts.forEach((act) => {
        caresheet?.tasks.push(act?.medical);
      });
      await this.interfacageService.compute(caresheet);

      await this.sesamvitaleTeletranmistionService.transmettrePatient(
        user,
        patient,
      );

      let datePrescription: string = date_prescription;
      if (datePrescription) {
        datePrescription = dayjs(datePrescription).format('YYYYMMDD');
      } else {
        const actDates = acts.map((act) => new Date(act?.date).getTime());
        const minDate = actDates.length ? new Date(Math.min(...actDates)) : '';
        datePrescription = minDate && dayjs(minDate).format('YYYYMMDD');
      }

      const facture = {
        identification: {
          idPatient: patient?.externalReferenceId,
          dateFacturation: dayjs().format('YYYYMMDD'),
          datePrescription: datePrescription,
          numFiness: user?.medical?.finessNumber,
          numNatPs: user?.medical?.nationalIdentifierNumber,
          numNatPsRemplace: user?.medical?.nationalIdentifierNumberRemp,
          isTpAmo: is_tp_amo ?? false,
          isTpAmc: is_tp_amc ?? false,
          prescripteur,
          modeSecurisation: user?.setting?.sesamVitaleModeDesynchronise
            ? 'DESYNCHR'
            : undefined,
          ParcoursDeSoin: {
            situationParcoursDeSoin: situation_parcours_de_soin,
            nomMedecinOrienteur: nom_medecin_orienteur,
            prenomMedecinOrienteur: prenom_medecin_orienteur,
          },
        },
        actes: [],
      };

      if (generer_dre) {
        facture.identification['GenererDRE'] = Boolean(generer_dre);
      }

      const participationAssures = [];
      if (
        this.isEligibleForParticipationAssure(
          patient?.amos,
          new Date(caresheet?.date),
        )
      ) {
        const groupBy: { [key: string]: EventTaskEntity[] } = {};

        acts.forEach((act) => {
          const dateKey = dayjs(act?.date).format('YYYYMMDD');
          if (!groupBy[dateKey]) {
            groupBy[dateKey] = [];
          }
          groupBy[dateKey].push(act);
        });
        for (const [, collection] of Object.entries(groupBy)) {
          const collectionFilteredByFamilyCode = collection.filter(
            (act) =>
              (!act?.medical ? false : act?.medical !== null) &&
              PAV_AUTHORIZED_CODES.includes(act?.medical?.ccam?.family?.code),
          );
          const amounts = collection.map((act) => act?.amount);
          const totalAmount = amounts.reduce((acc, cur) => acc + cur, 0);
          if (
            collectionFilteredByFamilyCode.length &&
            totalAmount >= PAV_MINIMUM_AMOUNT
          ) {
            const collection = collectionFilteredByFamilyCode.sort(
              (a, b) => a?.amount - b?.amount,
            );
            participationAssures.push(collection[collection.length - 1]?.id);
          }
        }
      }

      // DÉPISTAGE DE LA COVID-19
      // Il faut paramétrer une exonération « div 3 » si il existe un des actes suivant :
      // - TEST ANTIGÉNIQUE : C 1.13
      // - PRÉLÈVEMENT NASOPHARYNGÉ : C 0.42
      // - PRÉLÈVEMENT OROPHARYNGÉ : C 0.25
      let codeJustifExoneration = undefined;
      if (
        acts.reduce(
          (isTestAntigenique, act) =>
            isTestAntigenique || this.isTestAntigenique(act?.medical),
          false,
        )
      ) {
        codeJustifExoneration = 3;
      }
      for (const act of acts) {
        const amount = act?.amount;
        const amoAmount = act?.medical?.secuAmount;
        const coefficient = act?.medical?.coef;
        const rawTeeth = act?.medical?.teeth
          ?.split(',')
          .map((tooth) => (tooth === '00' ? ['01', '02'] : tooth))
          .flat();
        const teeth = Array.from(new Set(rawTeeth));
        const acte = {
          qte: 1,
          dateExecution: act?.date,
          codeActe: act?.medical?.ccam
            ? act?.medical?.ccam?.code
            : act?.medical?.ngapKey?.name === 'CBX'
            ? 'CCX'
            : act?.medical?.ngapKey?.name, // nameToTransmit
          coefficient: coefficient,
          montantHonoraire: amount !== amoAmount ? amount : undefined,
          libelle: act?.name,
          numeroDents: teeth.join(','),
          codeAssociation: act?.medical?.associationCode,
          codeAccordPrealable: code_accord_prealable,
          codeJustifExoneration: undefined,
          qualifDepense: act?.medical?.exceeding,
          dateDemandePrealable: date_demande_prealable,
          remboursementExceptionnel: undefined,
          complementPrestation: undefined,
          isAld: undefined,
        };

        if (act?.medical?.exceeding === String(ExceedingEnum.GRATUIT)) {
          acte.montantHonoraire = null;
        }

        const exemptionCode = act?.medical?.exemptionCode;
        if (!!exemptionCode) {
          acte.codeJustifExoneration = exemptionCode;
          if (exemptionCode === ExemptionCodeEnum.DISPOSITIF_PREVENTION) {
            facture.identification.isTpAmo = true;
          }
        }
        if (codeJustifExoneration !== undefined) {
          acte.codeJustifExoneration = codeJustifExoneration;
        }

        const ngapKey = act?.medical?.ngapKey;
        if (ngapKey) {
          acte.complementPrestation = act?.medical?.complement;
          const name = ngapKey?.name;
          if (name === 'IK') {
            acte.qte = coefficient;
            acte.montantHonoraire = undefined;
            acte.coefficient = 1;
          } else if (['FDA', 'FDC', 'FDO', 'FDR'].includes(name)) {
            acte.montantHonoraire = amount;
            acte.coefficient = 1;
          } else if (['TSA', 'TSM'].includes(name)) {
            acte.montantHonoraire = amount;
          } else if (['CBX'].includes(name)) {
            facture.identification.isTpAmo = true;
          }
        }

        const ccam = act?.medical?.ccam;
        if (ccam && !!ccam?.repayableOnCondition) {
          acte.remboursementExceptionnel = act?.medical?.exceptionalRefund;
        }

        /** === MODIFICATEURS === */
        const modifiers = act?.medical?.ccamModifier ?? [];
        for (let i = 0; i < modifiers.length; i++) {
          acte['codeModificateur' + (i + 1)] = modifiers[i];
        }
        const intersectedModifiers: string[] = ['N', 'E'].filter((item) =>
          modifiers.includes(item),
        );
        if (intersectedModifiers.length) {
          acte.montantHonoraire = amount;
        }
        if (!!request?.suite_exp) {
          facture.identification.isTpAmo = true;
          acte.codeJustifExoneration = 7;
        }
        // if (relatedToAnAld) {
        //   facture.identification.isTpAmo = true;
        // }
        const patientAmo = this.getActiveAmo(
          patient?.amos,
          new Date(caresheet?.date),
        );
        if (patientAmo.length && patientAmo?.[0]?.isAld) {
          acte.isAld = act?.medical?.ald;
          if (act?.medical?.ald) {
            facture.identification.isTpAmo = true;
          }
        }
        facture.actes.push(acte);
      }
      const data =
        await this.sesamvitaleTeletranmistionService.transmettreFacture(
          facture,
        );
      if (data) {
        caresheet.externalReferenceId = data?.idFacture?.[0];
      }
      return await this.fseRepository.save({ ...caresheet });
    } catch (error) {
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }

  private isTestAntigenique(medical): boolean {
    if (!medical?.ngapKey) {
      return false;
    }
    return (
      medical?.ngapKey.name === 'C' &&
      [0.25, 0.42, 1.13].includes(medical?.ngapKey?.coefficient)
    );
  }

  private isEligibleForParticipationAssure = (
    amos: PatientAmoEntity[],
    dateTime: Date,
  ) => {
    const amo: any = this.getActiveAmo(amos, dateTime);
    return (
      !amo.length ||
      ([
        CodeNatureAssuranceEnum.ASSURANCE_MALADIE,
        CodeNatureAssuranceEnum.ALSACE_MOSELLE,
      ].includes(amo?.codeNatureAssurance) &&
        [
          ExemptionCodeEnum.PAS_EXONERATION,
          ExemptionCodeEnum.REGIMES_SPECIAUX,
        ].includes(amo?.codeExoneration))
    );
  };

  private getActiveAmo = (amos: PatientAmoEntity[], date: Date) => {
    return amos.filter((amo) => {
      return (
        amo?.startDate === null ||
        (isBefore(new Date(amo?.startDate), new Date(date)) &&
          (amo?.endDate === null ||
            isAfter(new Date(amo?.endDate), new Date(date))))
      );
    });
  };

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
      options: { optionsCaresheetPdf },
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
      });
      if (!caresheet) {
        throw new CBadRequestException(ErrorCode.FILE_NOT_FOUND);
      }
      await this.fseRepository.delete({ id });

      return { success: true };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.DELETE_UNSUCCESSFUL);
    }
  }

  async updateCaresheet(id: number) {
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
          amos: true,
          amcs: true,
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

    const prestations = associatifToSequential(facture?.prestations);
    if (prestations && prestations.length > 0) {
      for (const prestation of prestations) {
        const montantAMO = parseFloat(prestation?.montantAMO);
        const montantAMC = parseFloat(prestation?.montantAMC);
        amount += parseFloat(prestation?.montantTotal);
        amountPatient += parseFloat(prestation?.montantPP);
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

    caresheet.amo = amo;
    caresheet.amc = amc;

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
        const presentationCode = prestation?.codesActes?.[0].code?.[0];
        const prestationMontantTotal = prestation?.montantTotal?.[0];
        if (presentationCode === code && prestationMontantTotal === amount) {
          actMedicals.secuRepayment = prestation?.montantAMO?.[0];
          actMedicals.mutualRepayment = prestation?.montantAMC?.[0];
          actMedicals.personAmount = prestation?.montantPP?.[0];

          await this.dentalEventTaskRepository.save(actMedicals);

          const ccamFamily = actMedicals?.act?.ccamFamily;
          if (ccamFamily && this.isProsthesis(ccamFamily)) {
            amountAmoProsthesis += parseFloat(prestation?.montantAMO?.[0] || 0);
            amountAmcProsthesis += parseFloat(prestation?.montantAMC?.[0] || 0);
          } else {
            amountAmoCare += parseFloat(prestation?.montantAMO?.[0] || 0);
            amountAmcCare += parseFloat(prestation?.montantAMC?.[0] || 0);
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
      thirdPartyAmo.amo = caresheet?.amo;
      thirdPartyAmo.amoId = caresheet?.amo?.id;
      thirdPartyAmo.amount = amountAmo;
      thirdPartyAmo.amountCare = amountAmoCare;
      thirdPartyAmo.amountProsthesis = amountAmoProsthesis;
      caresheet.tiersPayant = 1;
      caresheet.tiersPayantStatus = EnumThirdPartyStatus.WAITING;

      const amountThirdParty = caresheet?.thirdPartyAmount + amountAmo;
      caresheet.thirdPartyAmount = amountThirdParty;
      caresheet.thirdPartyAmo = thirdPartyAmo;
    }
    if (amcIsTp && amountAmc) {
      const thirdPartyAmc = new ThirdPartyAmcEntity();
      thirdPartyAmc.userId = caresheet?.usrId;
      thirdPartyAmc.patientId = caresheet?.conId;
      thirdPartyAmc.amc = caresheet?.amc;
      thirdPartyAmc.amcId = caresheet?.amc?.id;
      thirdPartyAmc.amount = amountAmc;
      thirdPartyAmc.amountCare = amountAmcCare;
      thirdPartyAmc.amountProsthesis = amountAmcProsthesis;

      const typeFacture = facture.typeFacture?.[0];
      typeFacture == 'FDE'
        ? (thirdPartyAmc.isDre = 1)
        : (thirdPartyAmc.isDre = 0);
      caresheet.tiersPayant = 1;
      caresheet.tiersPayantStatus = EnumThirdPartyStatus.WAITING;
      const amountThirdParty = caresheet.thirdPartyAmount + amountAmc;
      caresheet.thirdPartyAmount = amountThirdParty;
      caresheet.thirdPartyAmc = thirdPartyAmc;
    }

    return await this.fseRepository.save(caresheet);
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

  private getActiveAmc = (amcs: PatientAmcEntity[], date: Date) => {
    return amcs.filter((amc) => {
      return (
        amc?.startDate === null ||
        (isBefore(new Date(amc?.startDate), new Date(date)) &&
          (amc?.endDate === null ||
            isAfter(new Date(amc?.endDate), new Date(date))))
      );
    });
  };
}
