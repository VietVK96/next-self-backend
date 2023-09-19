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
import { CodeNatureAssuranceEnum } from 'src/constants/act';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { ExemptionCodeEnum } from 'src/enum/exemption-code.enum';
import { ConfigService } from '@nestjs/config';
import { CaresheetStatusEntity } from 'src/entities/caresheet-status.entity';
import { RequestException } from 'src/common/exceptions/request-exception.exception';
import { ThirdPartyAmcEntity } from 'src/entities/third-party-amc.entity';
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
const PDFMerger = require('pdf-merger-js');

const PAV_AUTHORIZED_CODES = ['ACO', 'ADA', 'ADC', 'ADE', 'ATM'];
const PAV_MINIMUM_AMOUNT = 120;
const helpersCaresheetPdf = {
  formatDate: function (date: string) {
    return dayjs(date).format('DDMMYYYY');
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
    @InjectRepository(DentalEventTaskEntity)
    private dentalEventTaskRepository: Repository<DentalEventTaskEntity>,
    @InjectRepository(CaresheetStatusEntity)
    private caresheetStatusRepository: Repository<CaresheetStatusEntity>,
    @InjectRepository(ThirdPartyAmcEntity)
    private thirdPartyAmcRepository: Repository<ThirdPartyAmcEntity>,
    @InjectRepository(ThirdPartyAmoEntity)
    private thirdPartyAmoRepository: Repository<ThirdPartyAmoEntity>,
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
      } = request;
      const [patient, user] = await Promise.all([
        this.patientRepository.findOneOrFail({
          relations: ['amos'],
          where: { id: patient_id },
        }),
        this.userRepository.findOneOrFail({
          relations: ['medical'],
          where: { id: user_id },
        }),
      ]);
      const dataActs: EventTaskEntity[] = await this.eventTaskRepository.find({
        relations: ['medical'],
        where: { id: In(act_id), conId: patient_id },
      });
      if (!dataActs.length) {
        throw new CBadRequestException(ErrorCode.ERROR_CARESHEET_ACTS_IS_EMPTY);
      }
      const caresheet: FseEntity = {};
      caresheet.usrId = user?.id;
      caresheet.conId = patient?.id;
      caresheet.numeroFacturation = user?.medical?.finessNumber;
      caresheet.date = format(new Date(), 'yyyy-MM-dd');
      caresheet.tasks = [];
      caresheet.fseStatus = await this.caresheetStatusRepository.findOne({
        where: { value: 0 },
      });
      caresheet.dreStatus = caresheet.fseStatus;
      dataActs.forEach((act) => {
        caresheet.tasks.push(act);
      });
      await this.interfacageService.compute(caresheet);
      //convert funtion transmettrePatient in client services
      if (
        !patient?.firstname &&
        !patient?.lastname &&
        !patient?.birthDate &&
        !patient?.birthRank &&
        !patient?.insee &&
        !patient?.inseeKey
      ) {
        throw new CBadRequestException(ErrorCode.ERROR_PATIENT_IS_REQUIRED);
      } else {
        this.transmettrePatient(user, patient);
      }

      let datePrescription: Date;
      if (date_prescription) {
        datePrescription = new Date(date_prescription);
      } else {
        const actDates = dataActs.map((act) => new Date(act?.date).getTime());
        const minDate = actDates.length ? new Date(Math.min(...actDates)) : '';
        datePrescription = minDate ? new Date(minDate) : new Date();
      }

      const facture = {
        identification: {
          idPatient: patient?.externalReferenceId,
          dateFacturation: new Date(),
          datePrescription: datePrescription,
          numFiness: user?.medical?.finessNumber,
          numNatPs: user?.medical?.nationalIdentifierNumber,
          numNatPsRemplace: user?.medical?.nationalIdentifierNumberRemp,
          isTpAmo: is_tp_amo ?? false,
          isTpAmc: is_tp_amc ?? false,
          prescripteur,
          modeSecurisation: user?.setting?.sesamVitaleModeDesynchronise
            ? 'DESYNCHR'
            : null,
          ParcoursDeSoin: {
            situationParcoursDeSoin: situation_parcours_de_soin,
            nomMedecinOrienteur: nom_medecin_orienteur,
            prenomMedecinOrienteur: prenom_medecin_orienteur,
          },
        },
        actes: [],
      };

      const relatedToAnAld = related_ald ?? false;
      const participationAssures = [];
      if (
        this.isEligibleForParticipationAssure(
          patient?.amos,
          caresheet?.createdAt,
        ) &&
        !relatedToAnAld
      ) {
        const groupBy: { [key: string]: EventTaskEntity[] } = {};

        dataActs.forEach((act) => {
          const dateKey = new Date(act?.date)
            .toISOString()
            .split('T')[0]
            .replace(/-/g, '');
          if (!groupBy[dateKey]) {
            groupBy[dateKey] = [];
          }
          groupBy[dateKey].push(act);
        });
        for (const [, raws] of Object.entries(groupBy)) {
          const collectionFilteredByFamilyCode = raws.filter(
            (act) =>
              act?.medical?.ccam &&
              PAV_AUTHORIZED_CODES.includes(act?.medical?.ccam?.code),
          );
          const amounts = raws.map((act) => act?.amount);
          const totalAmount = amounts.reduce((acc, cur) => acc + cur, 0);
          if (
            collectionFilteredByFamilyCode.length &&
            totalAmount > PAV_MINIMUM_AMOUNT
          ) {
            const raws = collectionFilteredByFamilyCode.sort(
              (a, b) => a?.amount - b?.amount,
            );
            participationAssures.push(raws[raws.length - 1]);
          }
        }
      }

      // DÉPISTAGE DE LA COVID-19
      // Il faut paramétrer une exonération « div 3 » si il existe un des actes suivant :
      // - TEST ANTIGÉNIQUE : C 1.13
      // - PRÉLÈVEMENT NASOPHARYNGÉ : C 0.42
      // - PRÉLÈVEMENT OROPHARYNGÉ : C 0.25
      let codeJustifExoneration = null;
      if (
        dataActs.reduce(
          (isTestAntigenique, act) =>
            isTestAntigenique || this.isTestAntigenique(act?.medical),
          false,
        )
      ) {
        codeJustifExoneration = 3;
      }
      for (const act of dataActs) {
        const amount = act?.amount;
        const amoAmount = act?.medical?.secuAmount;
        const coefficient = act?.medical?.coef;
        const rawTeeth = act?.medical?.teeth
          ?.split(',')
          .map((tooth) => (tooth === '00' ? ['01', '02'] : tooth))
          .flat(); // LOGIC?act.entity
        const teeth = Array.from(new Set(rawTeeth));
        const acte = {
          qte: 1,
          isAld: false,
          dateExecution: act?.date,
          codeActe: act?.medical?.ccam
            ? act?.medical?.ccam?.code
            : act?.medical?.ngapKey?.name, // nameToTransmit
          coefficient: coefficient,
          montantHonoraire: amount !== amoAmount ? amount : null,
          libelle: act?.name,
          numeroDents: teeth.join(','),
          codeAssociation: act?.medical?.associationCode,
          codeAccordPrealable: code_accord_prealable,
          codeJustifExoneration: null,
          qualifDepense: act?.medical?.exceeding,
          dateDemandePrealable: date_demande_prealable,
          remboursementExceptionnel: null,
          complementPrestation: null,
        };

        const exemptionCode = act?.medical?.exemptionCode;
        if (!!exemptionCode) {
          acte.codeJustifExoneration = exemptionCode;
          if (exemptionCode === ExemptionCodeEnum.DISPOSITIF_PREVENTION) {
            facture.identification.isTpAmo = true;
          }
        }
        if (codeJustifExoneration !== null) {
          acte.codeJustifExoneration = codeJustifExoneration;
        }

        const ngapKey = act?.medical?.ngapKey;
        if (ngapKey) {
          acte.complementPrestation = act?.medical?.complement;
          const name = ngapKey?.name;
          if (name === 'IK') {
            acte.qte = coefficient;
            acte.montantHonoraire = null;
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
        const intersectedModifiers: string[] = ['N', 'A', 'E', 'B'].filter(
          (modifier) => ['N', 'E'].includes(modifier),
        );
        if (intersectedModifiers.length) {
          acte.montantHonoraire = amount;
        }
        if (!!request?.suite_exp) {
          facture.identification.isTpAmo = true;
          acte.codeJustifExoneration = 7;
        }
        if (relatedToAnAld) {
          facture.identification.isTpAmo = true;
        }
        acte.isAld = !!relatedToAnAld;
        facture.actes.push(acte);
      }
      this.transmettreFactureXml(facture);
      // On transmet la facture à FSV.
      // const response = await this.transmettreFacture(facture);
      // caresheet.externalReferenceId = response?.idFacture;
      return await this.fseRepository.save({ ...caresheet });
    } catch (error) {
      // return (new ExceptionController($container -> get('twig'))) -> showAction($request, $e) -> send();
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }
  private transmettrePatient = (user: UserEntity, patient: ContactEntity) => {
    const getTimeString = (date: string, type: string) => {
      if (!date) return '';
      const currentDate = format(new Date(date), 'yyyy-MM-dd');
      const time = currentDate.split('-');
      switch (type) {
        case 'day':
          return time[0];
        case 'month':
          return time[1];
        case 'year':
          return time[2];
      }
    };
    const numFacturation = user?.medical?.finessNumber ?? '';
    const numRpps = user?.medical?.nationalIdentifierNumber ?? '';
    const idPatient = patient?.externalReferenceId ?? '';
    const nom = patient.lastname ?? '';
    const prenom = patient.firstname ?? '';
    const jour = getTimeString(patient?.birthDate, 'day');
    const mois = getTimeString(patient?.birthDate, 'month');
    const annee = getTimeString(patient?.birthDate, 'year');
    const lunaire = !!patient?.birthDateLunar ? 'true' : 'false';
    const numeroSS = patient?.insee ?? '';
    const cleNumeroSS = patient?.inseeKey ?? '';
    const rangNaissance = patient?.birthRank ?? '';
    const xml = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd">
      <soapenv:Body>
        <jux:transmettrePatient>
          <xsd:appelTransmettrePatient>
            <xsd:numFacturation>${numFacturation}</xsd:numFacturation>
            <xsd:numRpps>${numRpps}</xsd:numRpps>
            ${idPatient ? `<xsd:idPatient>${numRpps}</xsd:idPatient>` : ``}
            <xsd:nom>${nom}</xsd:nom>
            <xsd:prenom>${prenom}</xsd:prenom>
            <xsd:dateNaissance>
              <xsd:jour>${jour}</xsd:jour>
              <xsd:mois>${mois}</xsd:mois>
              <xsd:annee>${annee}</xsd:annee>
              <xsd:lunaire>${lunaire}</xsd:lunaire>
            </xsd:dateNaissance>
            <xsd:numeroSS>${numeroSS}</xsd:numeroSS>
            <xsd:cleNumeroSS>${cleNumeroSS}</xsd:cleNumeroSS>
            <xsd:rangNaissance>${rangNaissance}</xsd:rangNaissance>
          </xsd:appelTransmettrePatient>
        </jux:transmettrePatient>
      </soapenv:Body>
    </soapenv:Envelope>`;

    // $response = $this->sendRequest('transmettrePatient', $xml->outputMemory());
    // if (!$patient->getExternalReferenceId()) {
    //     $patient->setExternalReferenceId($response['idPatient']);
    //     $this->em->persist($patient);
    //     $this->em->flush();
    // }
    // return $response;
    return xml;
  };
  private transmettreFactureXml(data: {
    identification: {
      idPatient?: number;
      dateFacturation?: Date;
      datePrescription?: Date;
      numFiness?: string;
      numNatPs?: string;
      numNatPsRemplace?: string;
      isTpAmo?: boolean;
      isTpAmc?: boolean;
      prescripteur?: string;
      modeSecurisation?: string;
      ParcoursDeSoin: {
        situationParcoursDeSoin?: string;
        nomMedecinOrienteur?: string;
        prenomMedecinOrienteur?: string;
      };
      genererDRE?: boolean;
    };
    actes: any[];
  }) {
    const _getpPescripteurXml = (prescripteur: any) => {
      const codeConditionExercice = prescripteur?.codeConditionExercice ?? '';
      const numIdFacPresc = prescripteur?.numIdFacPresc ?? '';
      const rppsPresc = prescripteur?.rppsPresc ?? '';
      const numeroStructure = prescripteur?.numeroStructure ?? '';
      const codeSpecialite = prescripteur?.codeSpecialite ?? '';
      const estPrescipteurSncf = prescripteur?.estPrescipteurSncf ?? '';
      if (numIdFacPresc) {
        return `
        <xsd:prescripteur>
          <xsd:codeConditionExercice>${codeConditionExercice}</xsd:codeConditionExercice>
          <xsd:numIdFacPresc>${numIdFacPresc?.slice(0, -1)}</xsd:numIdFacPresc>
          <xsd:numIdFacPrescCle>${numIdFacPresc?.slice(
            -1,
          )}</xsd:numIdFacPrescCle>
          <xsd:codeSpecialite>${codeSpecialite}</xsd:codeSpecialite>
          <xsd:rppsPresc>${rppsPresc?.slice(0, -1)}</xsd:rppsPresc>
          <xsd:rppsPrescCle>${rppsPresc?.slice(-1)}</xsd:rppsPrescCle>
          <xsd:numeroStructure>${numeroStructure}</xsd:numeroStructure>
          <xsd:estPrescipteurSncf>${estPrescipteurSncf}</xsd:estPrescipteurSncf>
        <xsd:prescripteur/>
        `;
      }
      return '';
    };

    const _getSituationParcoursDeSoin = () => {
      const situationParcoursDeSoin =
        data?.identification?.ParcoursDeSoin?.situationParcoursDeSoin ?? '';
      if (situationParcoursDeSoin) {
        const nomMedecinOrienteur =
          data?.identification?.ParcoursDeSoin?.nomMedecinOrienteur ?? '';
        const prenomMedecinOrienteur =
          data?.identification?.ParcoursDeSoin?.prenomMedecinOrienteur ?? '';
        return `
        <xsd:ParcoursDeSoin>
          <xsd:situationParcoursDeSoin>${situationParcoursDeSoin}</xsd:situationParcoursDeSoin>
          <xsd:nomMedecinOrienteur>${nomMedecinOrienteur}</xsd:nomMedecinOrienteur>
          <xsd:prenomMedecinOrienteur>${prenomMedecinOrienteur}</xsd:prenomMedecinOrienteur>
        </xsd:ParcoursDeSoin>
        `;
      }
      return '';
    };

    const formatDate = (date?: string | Date) => {
      try {
        if (!date) return '';
        if (date === 'Invalid Date') return '';
        return format(new Date(date), 'yyyyMMdd');
      } catch {
        return '';
      }
    };
    const xml = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:jux="http://www.juxta.fr" xmlns:xsd="XsdWebServiceFSV.xsd">
      <soapenv:Body>
        <jux:TransmettreFacture>
          <xsd:appelTransmettreFacture>
            <xsd:identification>
              <xsd:idPatient>${
                data?.identification?.idPatient ?? ''
              }</xsd:idPatient>
              <xsd:source>weclever</xsd:source>
              <xsd:dateFacturation format="yyyyMMdd">${formatDate(
                data?.identification?.dateFacturation,
              )}</xsd:dateFacturation>
              <xsd:datePrescription format="yyyyMMdd">${formatDate(
                data?.identification?.datePrescription,
              )}</xsd:datePrescription>
              <xsd:numNatPs>${
                data?.identification?.numNatPs ?? ''
              }</xsd:numNatPs>
              <xsd:numFiness>${
                data?.identification?.numFiness ?? ''
              }</xsd:numFiness>
              <xsd:numNatPsRemplace>${
                data?.identification?.numNatPsRemplace ?? ''
              }</xsd:numNatPsRemplace>
              <xsd:isTpAmo>${
                data?.identification?.isTpAmo ? 'true' : 'false'
              }</xsd:isTpAmo>
              <xsd:isTpAmc>${
                data?.identification?.isTpAmc ? 'true' : 'false'
              }</xsd:isTpAmc>
              ${
                (data?.identification?.genererDRE ?? null) !== null
                  ? `<xsd:GenererDRE>${
                      data?.identification?.genererDRE ? 'true' : 'false'
                    }</xsd:GenererDRE>`
                  : ``
              }
              ${
                (data?.identification?.modeSecurisation ?? null) !== null
                  ? `<xsd:modeSecurisation>${data?.identification?.modeSecurisation}</xsd:GenererDRE>`
                  : ``
              }
              ${_getpPescripteurXml(data?.identification?.prescripteur)}
              ${_getSituationParcoursDeSoin()}
            </xsd:identification>
            ${data?.actes
              ?.map(
                (acte, index) => `
                <xsd:acte>
                <xsd:numero>${index}</xsd:numero>
                <xsd:dateExecution format="yyyyMMdd">${formatDate(
                  acte?.dateExecution,
                )}</xsd:dateExecution>
                <xsd:codeActe>${acte?.codeActe ?? ''}</xsd:codeActe>
                <xsd:qte>${acte?.qte ?? ''}</xsd:qte>
                <xsd:montantHonoraire>${
                  acte?.montantHonoraire ?? ''
                }</xsd:montantHonoraire>
                <xsd:libelle>${acte?.libelle ?? ''}</xsd:libelle>
                <xsd:numeroDents>${acte?.numeroDents ?? ''}</xsd:numeroDents>
                <xsd:coefficient>${acte?.coefficient ?? ''}</xsd:coefficient>
                ${
                  acte?.codeAssociation
                    ? `<xsd:codeAssociation>${acte?.coefficient}</xsd:codeAssociation>`
                    : ``
                }
                ${
                  acte?.qualifDepense
                    ? `<xsd:qualifDepense>${acte?.qualifDepense}</xsd:qualifDepense>`
                    : ``
                }
                ${
                  acte?.complementPrestation
                    ? `<xsd:complementPrestation>${acte?.complementPrestation}</xsd:complementPrestation>`
                    : ``
                }
                ${
                  acte?.codeModificateur1
                    ? `<xsd:codeModificateur1>${acte?.codeModificateur1}</xsd:codeModificateur1>`
                    : ``
                }
                ${
                  acte?.codeModificateur2
                    ? `<xsd:codeModificateur2>${acte?.codeModificateur2}</xsd:codeModificateur2>`
                    : ``
                }
                ${
                  acte?.codeModificateur3
                    ? `<xsd:codeModificateur3>${acte?.codeModificateur3}</xsd:codeModificateur3>`
                    : ``
                }
                ${
                  acte?.codeModificateur4
                    ? `<xsd:codeModificateur4>${acte?.codeModificateur4}</xsd:codeModificateur4>`
                    : ``
                }
                ${
                  acte?.remboursementExceptionnel !== undefined
                    ? `<xsd:remboursementExceptionnel>${
                        !!acte?.remboursementExceptionnel ? 'true' : 'false'
                      }</xsd:remboursementExceptionnel>`
                    : ``
                }
                ${
                  acte?.codeJustifExoneration
                    ? `<xsd:codeJustifExoneration>${acte?.codeJustifExoneration}</xsd:codeJustifExoneration>`
                    : ``
                }
                ${
                  acte?.isAld !== undefined
                    ? `<xsd:isAld>${
                        !!acte?.isAld ? 'true' : 'false'
                      }</xsd:isAld>`
                    : ``
                }
                ${
                  acte?.dateDemandePrealable
                    ? `<xsd:dateDemandePrealable format="yyyyMMdd">${formatDate(
                        acte?.dateDemandePrealable,
                      )}</xsd:dateDemandePrealable>`
                    : ``
                }
                ${
                  acte?.codeAccordPrealable
                    ? `<xsd:dateDemandePrealable">${acte?.codeAccordPrealable}</xsd:dateDemandePrealable>`
                    : ``
                }
              </xsd:acte>
              `,
              )
              .join('')}
           
          </xsd:appelTransmettreFacture>
        </jux:TransmettreFacture>
      </soapenv:Body>
    </soapenv:Envelope>`;

    // return $this->sendRequest('TransmettreFacture', $xml->outputMemory());
    return xml;
  }
  CCX;

  private isTestAntigenique(medical): boolean {
    if (!medical?.ngapKey) {
      return false;
    }
    return (
      medical?.ngapKey.name === 'C' &&
      [0.25, 0.42, 1.13].includes(medical?.ngapKey?.coefficient)
    );
  }

  private async transmettreFacture(facture: any) {
    const xml = create('jux:TransmettreFacture')
      .ele('xsd:appelTransmettreFacture')
      .ele('xsd:identification')
      .ele('xsd:idPatient', facture?.identification?.idPatient)
      .up()
      .ele('xsd:source', 'weClever')
      .up()
      .ele(
        'xsd:dateFacturation',
        format(facture?.identification?.dateFacturation, 'yyyyMMdd'),
      )
      .up()
      .ele(
        'xsd:datePrescription',
        format(facture?.identification?.datePrescription, 'yyyyMMdd'),
      )
      .up()
      .ele('xsd:numNatPs', facture?.identification?.numNatPs)
      .up()
      .ele('xsd:numFiness', facture?.identification?.numFiness)
      .up()
      .ele('xsd:numNatPsRemplace', facture?.identification?.numNatPsRemplace)
      .up()
      .ele('xsd:isTpAmo', String(facture?.identification?.isTpAmo ?? false))
      .up()
      .ele('xsd:isTpAmc', String(facture?.identification?.isTpAmc ?? false))
      .up();
    const modeSecurisation = facture?.identification?.modeSecurisation ?? null;
    if (modeSecurisation) {
      xml.ele('xsd:modeSecurisation', modeSecurisation).up();
    }
    const prescripteur = facture?.identification?.prescripteur ?? null;
    if (prescripteur) {
      const codeConditionExercice = prescripteur?.codeConditionExercice ?? null;
      const numIdFacPresc = prescripteur?.numIdFacPresc ?? null;
      const rppsPresc = prescripteur?.rppsPresc ?? null;
      const numeroStructure = prescripteur?.numeroStructure ?? null;
      const codeSpecialite = prescripteur?.codeSpecialite ?? null;
      const estPrescipteurSncf: boolean =
        prescripteur?.estPrescipteurSncf ?? null;
      if (numIdFacPresc) {
        xml
          .ele('xsd:prescripteur')
          .ele('xsd:codeConditionExercice', codeConditionExercice)
          .up()
          .ele('xsd:numIdFacPresc', numIdFacPresc.slice(0, -1))
          .up()
          .ele('xsd:numIdFacPrescCle', numIdFacPresc.slice(-1))
          .up()
          .ele('xsd:codeSpecialite', codeSpecialite)
          .up()
          .ele('xsd:rppsPresc', rppsPresc.slice(0, -1))
          .up()
          .ele('xsd:rppsPrescCle', rppsPresc.slice(-1))
          .up()
          .ele('xsd:numeroStructure', numeroStructure)
          .up()
          .ele('xsd:estPrescipteurSncf', String(estPrescipteurSncf))
          .up();
      }
    }
    const situationParcoursDeSoin =
      facture?.identification?.ParcoursDeSoin?.situationParcoursDeSoin ?? null;
    if (situationParcoursDeSoin) {
      const nomMedecinOrienteur =
        facture?.identification?.ParcoursDeSoin?.situationParcoursDeSoin ??
        null;
      const prenomMedecinOrienteur =
        facture?.identification?.ParcoursDeSoin?.nomMedecinOrienteur ?? null;

      xml
        .ele('xsd:ParcoursDeSoin')
        .ele('xsd:situationParcoursDeSoin', situationParcoursDeSoin)
        .up()
        .ele('xsd:nomMedecinOrienteur', nomMedecinOrienteur)
        .up()
        .ele('xsd:prenomMedecinOrienteur', prenomMedecinOrienteur)
        .up();
    }
    xml.up();
    facture?.actes.forEach((acte, index) => {
      xml
        .ele('xsd:acte')
        .ele('xsd:numero', index.toString())
        .up()
        .ele('xsd:dateExecution', format(acte?.dateExecution, 'yyyyMMdd'))
        .up()
        .ele('xsd:codeActe', acte?.codeActe)
        .up()
        .ele('xsd:qte', acte?.qte)
        .up();
      if (acte?.montantHonoraire)
        xml.ele('xsd:montantHonoraire', acte?.montantHonoraire).up();
      xml
        .ele('xsd:libelle', acte?.libelle)
        .up()
        .ele('xsd:numeroDents', acte?.numeroDents)
        .up()
        .ele('xsd:coefficient', acte?.coefficient)
        .up();
      if (acte?.codeAssociation)
        xml.ele('xsd:codeAssociation', acte?.codeAssociation).up();
      if (acte?.qualifDepense)
        xml.ele('xsd:qualifDepense', acte?.qualifDepense).up();
      if (acte?.complementPrestation)
        xml.ele('xsd:complementPrestation', acte?.complementPrestation).up();
      if (acte?.codeModificateur1) {
        xml
          .ele('xsd:codeModificateur1')
          .ele('xsd:codeModificateur', acte?.codeModificateur1)
          .up();
      }
      if (acte?.codeModificateur2) {
        xml
          .ele('xsd:codeModificateur2')
          .ele('xsd:codeModificateur', acte?.codeModificateur2)
          .up();
      }
      if (acte?.codeModificateur3) {
        xml
          .ele('xsd:codeModificateur3')
          .ele('xsd:codeModificateur', acte?.codeModificateur3)
          .up();
      }
      if (acte?.codeModificateur4) {
        xml
          .ele('xsd:codeModificateur4')
          .ele('xsd:codeModificateur', acte?.codeModificateur4)
          .up();
      }
      if (acte?.remboursementExceptionnel !== null)
        xml
          .ele(
            'xsd:remboursementExceptionnel',
            acte?.remboursementExceptionnel.toString(),
          )
          .up();
      if (acte?.codeJustifExoneration)
        xml.ele('xsd:codeJustifExoneration', acte?.codeJustifExoneration).up();
      if (acte?.isAld !== null)
        xml.ele('xsd:isAld', acte?.isAld.toString()).up();
      if (acte?.dateDemandePrealable) {
        xml
          .ele(
            'xsd:dateDemandePrealable',
            format(acte?.dateDemandePrealable, 'yyyyMMdd').substring(0, 10),
          )
          .up()
          .ele('xsd:codeAccordPrealable', acte?.codeAccordPrealable)
          .up();
      }

      xml.up();
    });

    xml.up().up().up().up();

    return await this.sendRequest('TransmettreFacture', xml.toString());
  }

  private isEligibleForParticipationAssure = (
    amos: PatientAmoEntity[],
    dateTime: Date,
  ) => {
    const amo: any = this.getActiveAmo(amos, dateTime);
    return (
      !amo ||
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
    return amos.length > 0 ? amos[0] : null;
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
          value: facture.etatLotFse,
        },
      });
      if (fseStatus) {
        caresheet.fseStatus = fseStatus;
      }
      const dreStatus = await this.caresheetStatusRepository.findOne({
        where: { value: facture.etatLotDre },
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
      relations: [
        'actMedicals',
        'amo',
        'amc',
        'actMedicals.act',
        'actMedicals.ccam',
        'actMedicals.ngapKey',
        'patient',
        'patient.medical',
        'patient.medical.policyHolder',
      ],
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
      relations: ['medical', 'medical.specialtyCode'],
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
      .where('lot.id  = :id', { id: id });

    const lot = await queryBuilder.getOne();

    const user = await this.userRepository.findOne({
      where: { id: user_id },
      relations: ['medical', 'medical.specialtyCode'],
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
}
