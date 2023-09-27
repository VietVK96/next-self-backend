import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as dayjs from 'dayjs';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { CodeNatureAssuranceEnum } from 'src/constants/act';
import { ErrorCode } from 'src/constants/error';
import { CaresheetStatusEntity } from 'src/entities/caresheet-status.entity';
import { ContactEntity } from 'src/entities/contact.entity';
import { DentalEventTaskEntity } from 'src/entities/dental-event-task.entity';
import { EventTaskEntity } from 'src/entities/event-task.entity';
import { FseEntity } from 'src/entities/fse.entity';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { UserEntity } from 'src/entities/user.entity';
import { ExceedingEnum } from 'src/enum/exceeding-enum.enum';
import { ExemptionCodeEnum } from 'src/enum/exemption-code.enum';
import { InterfacageService } from 'src/interfacage/services/interfacage.service';
import { CaresheetsDto } from '../dto/index.dto';
import { SesamvitaleTeletranmistionService } from './sesamvitale-teletranmistion.service';

const PAV_AUTHORIZED_CODES = ['ACO', 'ADA', 'ADC', 'ADE', 'ATM'];
const PAV_MINIMUM_AMOUNT = 120;

@Injectable()
export class StoreCaresheetsService {
  constructor(
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
    private sesamvitaleTeletranmistionService: SesamvitaleTeletranmistionService,
    @InjectRepository(DentalEventTaskEntity)
    private dentalEventTaskRepository: Repository<DentalEventTaskEntity>,
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
        date_demande_prealable,
        code_accord_prealable,
        generer_dre,
      } = request;
      const [patient, user] = await Promise.all([
        this.patientRepository.findOne({
          relations: { amos: true },
          where: { id: patient_id },
        }),
        this.userRepository.findOne({
          relations: { medical: true },
          where: { id: user_id },
        }),
      ]);
      const acts: EventTaskEntity[] = await this.eventTaskRepository.find({
        relations: {
          medical: { act: true, ccam: { family: true }, ngapKey: true },
        },
        where: { id: In(act_id), conId: patient_id },
      });
      if (acts?.length === 0) {
        throw new CBadRequestException(ErrorCode.ERROR_CARESHEET_ACTS_IS_EMPTY);
      }
      const caresheet: FseEntity = {};
      caresheet.usrId = user?.id;
      caresheet.conId = patient?.id;
      caresheet.numeroFacturation = user?.medical?.finessNumber;
      caresheet.date = dayjs().format('YYYY-MM-DD');
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
      if (data?.idFacture?.[0]) {
        caresheet.externalReferenceId = data?.idFacture?.[0];
      } else if (data?.erreur?.[0]?.libelleErreur?.[0]) {
        throw data?.erreur?.[0]?.libelleErreur?.[0];
      }
      const fseSave = await this.fseRepository.save({ ...caresheet });
      await Promise.all(
        caresheet?.tasks.map((item) => {
          return this.dentalEventTaskRepository.save({
            ...item,
            fseId: fseSave?.id,
          });
        }),
      );
      return await this.fseRepository.findOne({ where: { id: fseSave?.id } });
    } catch (error) {
      throw new CBadRequestException(
        error?.response?.msg || error?.sqlMessage || error,
      );
    }
  }

  private isTestAntigenique(medical: DentalEventTaskEntity): boolean {
    if (!medical?.ngapKey) {
      return false;
    }
    return (
      medical?.ngapKey.name === 'C' &&
      [0.25, 0.42, 1.13].includes(medical?.coef)
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
        (dayjs(amo?.startDate).isBefore(date) &&
          (amo?.endDate === null || dayjs(amo?.endDate).isAfter(date)))
      );
    });
  };
}
