import { Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { format, isAfter, isBefore } from 'date-fns';
import { create } from 'xmlbuilder2';
import axios from 'axios';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserEntity } from 'src/entities/user.entity';
import { ContactEntity } from '../../entities/contact.entity';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CaresheetsDto } from '../dto/index.dto';
import { FseEntity } from 'src/entities/fse.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { CaresheetModeEnum } from 'src/enum/caresheet.enum';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { InterfacageService } from 'src/interfacage/services/interfacage.service';
import { CodeNatureAssuranceEnum } from 'src/constants/act';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { ExemptionCodeEnum } from 'src/enum/exemption-code.enum';
import { CcamEntity } from 'src/entities/ccam.entity';
import { ConfigService } from '@nestjs/config';
import { CaresheetStatusEntity } from 'src/entities/caresheet-status.entity';
import { RequestException } from 'src/common/exceptions/request-exception.exception';

const PAV_AUTHORIZED_CODES = ['ACO', 'ADA', 'ADC', 'ADE', 'ATM'];
const PAV_MINIMUM_AMOUNT = 120;

interface ErrorResponse {
  erreur: {
    libelleErreur: string;
  };
}

@Injectable()
export class CaresheetsService {
  private readonly logger: Logger = new Logger(CaresheetsService.name);

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
        suite_exp,
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
        where: { id: In(act_id) },
      });
      const acts = dataActs.filter((act) => act.conId === patient.id);
      if (!!acts) {
        throw new CBadRequestException(ErrorCode.ERROR_CARESHEET_ACTS_IS_EMPTY);
      }
      const caresheet: FseEntity = null;
      caresheet.usrId = user?.id;
      caresheet.conId = patient?.id;
      caresheet.numeroFacturation = user?.medical?.finessNumber;
      caresheet.date = format(new Date(), 'yyyy-MM-dd');
      caresheet.fseStatus = await this.caresheetStatusRepository.findOne({
        where: { value: 0 },
      });
      caresheet.dreStatus = await this.caresheetStatusRepository.findOne({
        where: { value: 0 },
      });
      acts.forEach((act) => {
        this.dentalEventTaskRepository.save(act);
      });
      await this.interfacageService.compute(caresheet);

      let datePrescription: Date;
      if (date_prescription) {
        datePrescription = new Date(date_prescription);
      } else {
        const actDates = acts.map((act) => new Date(act?.date).getTime());
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
        actes: {},
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

        acts.forEach((act) => {
          const dateKey = new Date(act?.date)
            .toISOString()
            .split('T')[0]
            .replace(/-/g, '');
          if (!groupBy[dateKey]) {
            groupBy[dateKey] = [];
          }
          groupBy[dateKey].push(act);
        });
        for (const [key, raws] of Object.entries(groupBy)) {
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
        const amoAmount = act?.medical?.amoAmount;
        const coefficient = act?.medical?.coefficient;
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
          libelle: act?.label,
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
        const modifiers = act?.medical?.modifiers ?? [];
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
        facture.actes = acte;
      }
      // On transmet la facture à FSV.
      const response = await this.transmettreFacture(facture);
      caresheet.externalReferenceId = response?.idFacture;
      return await this.fseRepository.save({ ...caresheet });
    } catch (error) {
      // return (new ExceptionController($container -> get('twig'))) -> showAction($request, $e) -> send();
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

  private async transmettreFacture(facture: any) {
    const xml = create('jux:TransmettreFacture')
      .ele('xsd:appelTransmettreFacture')
      .ele('xsd:identification')
      .ele('xsd:idPatient', facture?.identification?.idPatient)
      .up()
      .ele('xsd:source', 'ecoodentist')
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
}