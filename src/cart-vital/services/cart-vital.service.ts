import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { DataSource } from 'typeorm';
import {
  ReadCardVitalDto,
  SaveCardVitalDto,
  SyncFsvDto,
  UpdateFSVDto,
} from '../dto/cart-vital.dto';
import { SesamvitaleTeletranmistionService } from 'src/caresheets/service/sesamvitale-teletranmistion.service';
import { ContactEntity } from 'src/entities/contact.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import * as dayjs from 'dayjs';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { UserEntity } from 'src/entities/user.entity';
import { GenderEntity } from 'src/entities/gender.entity';
import { metaphone } from 'src/common/util/metaphone';
import { IConsulterClient } from 'src/caresheets/interface/caresheet.interface';
import { PatientMedicalEntity } from 'src/entities/patient-medical.entity';
import { PatientAmoEntity } from 'src/entities/patient-amo.entity';
import { AmoEntity } from 'src/entities/amo.entity';
import { CodeNatureAssuranceEnum } from 'src/constants/act';
import { ExemptionCodeEnum } from 'src/enum/exemption-code.enum';
import { PatientAmcEntity } from 'src/entities/patient-amc.entity';
import { AmcEntity } from 'src/entities/amc.entity';
import { PolicyHolderEntity } from 'src/entities/policy-holder.entity';

@Injectable()
export class CartVitalService {
  constructor(
    private dataSource: DataSource,

    private sesamvitaleTeletranmistionService: SesamvitaleTeletranmistionService,
  ) {}

  async getHomonymsByLastNameAndFirstName(lastname: string, firstname: string) {
    const listPatient = this.dataSource.getRepository(ContactEntity).find({
      where: {
        lastNamePhonetic: metaphone(lastname).substring(0, 10),
        firstNamePhonetic: metaphone(firstname).substring(0, 10),
      },
    });
    return listPatient;
  }

  async updateFromSv(patient: ContactEntity, organization: OrganizationEntity) {
    const respone =
      await this.sesamvitaleTeletranmistionService.consulterClient(
        patient?.externalReferenceId,
      );

    const civilityTitle = await this.dataSource
      .getRepository(GenderEntity)
      .findOne({
        where: { code: Number(respone?.individu?.[0]?.codeCivilite?.[0]) },
      });
    patient.civilityTitle = civilityTitle ?? null;
    patient.lastname = respone?.individu?.[0]?.nomUsuel?.[0];
    patient.firstname = respone?.individu?.[0]?.prenom?.[0];
    patient.birthOrder = Number(respone?.individu?.[0]?.rangGem?.[0]);
    patient.insee = respone?.individu?.[0]?.nirIndividu?.[0];
    patient.inseeKey = respone?.individu?.[0]?.nirIndividuCle?.[0];

    const dateNaissance = respone?.individu?.[0]?.dateNaissance?.[0]?.['_'];
    const isDateLunaire =
      respone?.individu?.[0]?.isDateLunaire?.[0] === 'true' ? true : false;
    const matches = dateNaissance.match(
      /^(?<year>[0-9]{4})(?<month>[0-9]{2})(?<day>[0-9]{2})$/,
    );
    if (!isDateLunaire) {
      patient.birthday = dateNaissance
        ? dayjs(dateNaissance).format('YYYY-MM-DD')
        : null;
    } else if (matches) {
      patient.birthDateLunar = `${matches?.groups?.year}-${matches?.groups?.month}-${matches?.groups?.day}`;
      if (!patient?.birthday) {
        patient.birthday = `${matches?.groups?.year}-01-01`;
      }
    }

    patient = this.setServiceAmo(patient, respone);
    patient = await this.createOrUpdateAmcs(
      patient,
      respone?.individu?.[0]?.couvertureAMC ?? [],
    );
    patient = await this.createOrUpdateAmos(
      patient,
      respone?.individu?.[0]?.couvertureAMO ?? [],
    );

    if (respone?.individu?.[0]?.idAssure?.[0]) {
      patient = await this.updatePolicyHolder(
        patient,
        Number(respone?.individu?.[0]?.idAssure?.[0]),
      );
    }
    const amo = this.getActiveAmo(dayjs().format('YYYY-MM-DD'), patient);
    if (
      amo &&
      amo?.codeNatureAssurance === CodeNatureAssuranceEnum.ALSACE_MOSELLE
    ) {
      patient.amoTaux = 90;
    }
    const amos = patient?.amos;
    const amcs = patient?.amcs;
    const policyHolder = patient?.medical?.policyHolder;
    const medical = patient?.medical;
    delete patient?.amos;
    delete patient?.amcs;
    delete patient?.medical;

    const resultPatient = await this.dataSource
      .getRepository(ContactEntity)
      .save({
        ...patient,
        nbr: patient?.nbr ? patient?.nbr : organization?.maxPatientNumber + 1,
      });
    for (const amc of amcs) {
      const saveAmc = await this.dataSource
        .getRepository(AmcEntity)
        .save({ ...amc?.amc });
      await this.dataSource.getRepository(PatientAmcEntity).save({
        ...amc,
        patientId: resultPatient?.id,
        amcId: saveAmc?.id,
        amc: saveAmc,
      });
    }

    for (const amo of amos) {
      const saveAmo = await this.dataSource
        .getRepository(AmoEntity)
        .save({ ...amo?.amo });

      await this.dataSource.getRepository(PatientAmoEntity).save({
        ...amo,
        patientId: resultPatient?.id,
        amoId: saveAmo?.id,
        amo: saveAmo,
      });
    }
    const savePolicyHolder = await this.dataSource
      .getRepository(PolicyHolderEntity)
      .save({
        ...policyHolder,
        id: patient?.medical?.policyHolder?.id ?? null,
      });
    await this.dataSource.getRepository(PatientMedicalEntity).save({
      ...medical,
      patientId: resultPatient?.id ?? null,
      policyHolderId: savePolicyHolder?.id,
      policyHolder: savePolicyHolder,
    });

    if (resultPatient?.nbr !== patient?.nbr) {
      await this.dataSource.getRepository(OrganizationEntity).save({
        ...organization,
        maxPatientNumber: organization?.maxPatientNumber + 1,
      });
    }

    return resultPatient;
  }

  public getActiveAmo(date, patient: ContactEntity) {
    const amos = patient?.amos.find((item) => {
      return (
        item?.startDate &&
        item?.endDate &&
        dayjs(item?.startDate).diff(date) < 0 &&
        dayjs(item?.endDate).diff(date) > 0
      );
    });
    if (!amos) {
      return null;
    }
    return amos;
  }

  private setServiceAmo(patient: ContactEntity, datas: IConsulterClient) {
    const serviceAmoCode = datas?.individu?.[0]?.codeServiceAMO?.[0];
    const serviceAmoStartDate = datas?.individu?.[0]
      ?.dateDebutServiceAMO?.[0]?.['_']
      ? dayjs(datas?.individu?.[0]?.dateDebutServiceAMO?.[0]?.['_']).format(
          'YYYY-MM-DD',
        )
      : null;
    const serviceAmoEndDate = datas?.individu?.[0]?.dateFinServiceAMO?.[0]?.[
      '_'
    ]
      ? dayjs(datas?.individu?.[0]?.dateFinServiceAMO?.[0]?.['_']).format(
          'YYYY-MM-DD',
        )
      : null;

    const patientMedical = patient?.medical ?? new PatientMedicalEntity();
    patientMedical.serviceAmoCode = serviceAmoCode;
    patientMedical.serviceAmoStartDate = serviceAmoStartDate;
    patientMedical.serviceAmoEndDate = serviceAmoEndDate;

    patient.medical = patientMedical;
    return patient;
  }

  private async createOrUpdateAmos(patient: ContactEntity, couvertureAmos) {
    patient.amos = [];
    couvertureAmos = Array.from(couvertureAmos);

    for (const couvertureAmo of couvertureAmos) {
      const startDate = couvertureAmo?.dateDeb?.[0]?.['_']
        ? dayjs(couvertureAmo?.dateDeb?.[0]?.['_']).format('YYYY-MM-DD')
        : null;
      const endDate = couvertureAmo?.dateFin?.[0]?.['_']
        ? dayjs(couvertureAmo?.dateFin?.[0]?.['_']).format('YYYY-MM-DD')
        : null;
      let patientAmo: PatientAmoEntity =
        await this.findOneByPatientAndStartDateAndEndDateAmo(
          patient,
          startDate,
          endDate,
        );

      if (!patientAmo) {
        patientAmo = new PatientAmoEntity();
      }

      let amo = await this.dataSource.getRepository(AmoEntity).findOne({
        where: {
          grandRegime: couvertureAmo?.tiers?.[0]?.grandRegime?.[0],
          caisseGestionnaire: couvertureAmo?.tiers?.[0]?.codeCaisse?.[0],
          centreGestionnaire: couvertureAmo?.tiers?.[0]?.codeCentre?.[0],
        },
      });
      if (!amo) {
        amo = new AmoEntity();
        amo.libelle = couvertureAmo?.tiers?.[0]?.libelle?.[0];
        amo.organismeDestinataire = couvertureAmo?.tiers?.[0]?.orgDest?.[0];
        amo.centreInformatique = couvertureAmo?.tiers?.[0]?.centreInfo?.[0];
        amo.grandRegime = couvertureAmo?.tiers?.[0]?.grandRegime?.[0];
        amo.caisseGestionnaire = couvertureAmo?.tiers?.[0]?.codeCaisse?.[0];
        amo.centreGestionnaire = couvertureAmo?.tiers?.[0]?.codeCentre?.[0];
        amo.codeNational = amo?.caisseGestionnaire + amo?.centreGestionnaire;
      }

      patientAmo.amo = amo;
      patientAmo.amoId = amo?.id;
      patientAmo.startDate = startDate;
      patientAmo.endDate = endDate;
      patientAmo.isTp = couvertureAmo?.isTp?.[0] === 'true' ? 1 : 0;
      patientAmo.isAld = couvertureAmo?.codeAld?.[0] === 'true' ? 1 : 0;
      patientAmo.maternityDate = couvertureAmo?.materniteDate?.[0] ?? null;
      patientAmo.childbirthDate = patientAmo?.maternityDate
        ? dayjs(patientAmo?.maternityDate).add(9, 'month').format('YYYY-MM-DD')
        : null;
      patientAmo.codeNatureAssurance =
        couvertureAmo?.codeNatureAssurance?.[0] ??
        CodeNatureAssuranceEnum.ASSURANCE_MALADIE;
      patientAmo.codeExoneration =
        couvertureAmo?.codeJustifExoneration?.[0] ??
        ExemptionCodeEnum.PAS_EXONERATION;
      patientAmo.lectureAdr = couvertureAmo?.isLectureAdr?.[0]
        ? dayjs().format('YYYY-MM-DD')
        : null;

      patient.amos.push(patientAmo);
    }

    return patient;
  }

  private async createOrUpdateAmcs(patient: ContactEntity, couvertureAmcs) {
    patient.amcs = [];

    couvertureAmcs = Array.from(couvertureAmcs).filter((x: any) => {
      return x?.GU?.[0]?.mutnum?.[0] || x?.rnm?.[0];
    });

    for (const couvertureAmc of couvertureAmcs) {
      const startDate = couvertureAmc?.dateDeb?.[0]?.['_']
        ? dayjs(couvertureAmc?.dateDeb?.[0]?.['_']).format('YYYY-MM-DD')
        : null;
      const endDate = couvertureAmc?.dateDeb?.[0]?.['_']
        ? dayjs(couvertureAmc?.dateDeb?.[0]?.['_']).format('YYYY-MM-DD')
        : null;

      let patientAmc: PatientAmcEntity =
        await this.findOneByPatientAndStartDateAndEndDateAmc(
          patient,
          startDate,
          endDate,
        );

      if (!patientAmc) {
        patientAmc = new PatientAmcEntity();
      }

      const isGu = couvertureAmc?.isGu?.[0] === 'true' ? 1 : 0;
      const numero = couvertureAmc?.GU?.[0]?.mutnum?.[0]
        ? couvertureAmc?.GU?.[0]?.mutnum?.[0]
        : couvertureAmc?.rnm?.[0];

      let amc = await this.dataSource.getRepository(AmcEntity).findOne({
        where: {
          numero,
        },
      });
      if (!amc) {
        amc = new AmcEntity();
        amc.libelle = numero;
        amc.isGu = isGu;
        amc.numero = numero;
      }

      patientAmc.amc = amc;
      patientAmc.amcId = amc?.id;
      patientAmc.startDate = startDate;
      patientAmc.endDate = endDate;
      patientAmc.isTp = couvertureAmc?.isTp?.[0] === 'true' ? 1 : 0;
      patientAmc.isCmu = couvertureAmc?.isCmu?.[0] === 'true' ? 1 : 0;
      patientAmc.isDrePossible =
        couvertureAmc?.isDrePossible?.[0] === 'true' ? 1 : 0;
      patientAmc.typeAme = couvertureAmc?.typeAme?.[0] ?? null;
      patientAmc.lectureAdr = couvertureAmc?.isLectureAdr?.[0]
        ? dayjs().format('YYYY-MM-DD')
        : null;

      patient.amcs.push(patientAmc);
    }

    return patient;
  }

  private async updatePolicyHolder(
    patient: ContactEntity,
    externalReferenceId: number,
  ) {
    try {
      const policyHolderClient =
        await this.sesamvitaleTeletranmistionService.consulterClient(
          externalReferenceId,
        );

      const patientMedical = patient?.medical ?? new PatientMedicalEntity();
      let policyHolder = patientMedical?.policyHolder;

      if (!policyHolder) {
        policyHolder = new PolicyHolderEntity();
        policyHolder.organizationId = patient?.organizationId;
      }
      if (policyHolderClient?.individu) {
        policyHolder.name =
          policyHolderClient?.individu?.[0]?.nomUsuel?.[0] +
          ' ' +
          policyHolderClient?.individu?.[0]?.prenom?.[0];
        policyHolder.inseeNumber =
          policyHolderClient?.individu?.[0]?.nirIndividu?.[0] +
          policyHolderClient?.individu?.[0]?.nirIndividuCle?.[0];
      }
      const policyHolderPatient = await this.dataSource
        .getRepository(ContactEntity)
        .findOne({ where: { externalReferenceId } });

      if (policyHolderPatient) {
        policyHolder.patient = policyHolderPatient;
      }

      patientMedical.policyHolder = policyHolder;
      patient.medical = patientMedical;
      return patient;
    } catch (error) {}
  }

  public async findOneByPatientAndStartDateAndEndDateAmc(
    patient: ContactEntity,
    startDate,
    endDate,
  ) {
    try {
      const res = this.dataSource.getRepository(PatientAmcEntity).findOne({
        where: {
          patientId: patient?.id,
          startDate: dayjs(startDate).isValid() ? startDate : null,
          endDate: dayjs(endDate).isValid() ? endDate : null,
        },
      });
      return res;
    } catch (error) {
      return null;
    }
  }

  public async findOneByPatientAndStartDateAndEndDateAmo(
    patient: ContactEntity,
    startDate,
    endDate,
  ) {
    try {
      const res = this.dataSource.getRepository(PatientAmoEntity).findOne({
        where: {
          patientId: patient?.id,
          startDate: dayjs(startDate).isValid() ? startDate : null,
          endDate: dayjs(endDate).isValid() ? endDate : null,
        },
      });
      return res;
    } catch (error) {
      return null;
    }
  }

  async readCartVital(payload: ReadCardVitalDto) {
    let homonyms = false;
    const data = await this.sesamvitaleTeletranmistionService.consulterClient(
      payload?.external_reference_id,
    );
    if (!data?.individu?.[0]?.idPatient?.[0]) {
      throw new CBadRequestException(
        ErrorCode.NOT_FOUND_PATIENT_ID_IN_CART_VITAL,
      );
    }
    const patient = await this.dataSource.getRepository(ContactEntity).findOne({
      where: {
        externalReferenceId: Number(data?.individu?.[0]?.idPatient?.[0]),
      },
    });
    let patients = [];
    if (!patient) {
      const searchPatients = await this.dataSource
        .getRepository(ContactEntity)
        .find({
          where: {
            lastname: data?.individu?.[0]?.nomUsuel?.[0],
            firstname: data?.individu?.[0]?.prenom?.[0],
            birthOrder: Number(data?.individu?.[0]?.rangGem?.[0]),
            birthday: data?.individu?.[0]?.dateNaissance?.[0]?.['_']
              ? dayjs(data?.individu?.[0]?.dateNaissance?.[0]?.['_']).format(
                  'YYYY-MM-DD',
                )
              : null,
            insee: data?.individu?.[0]?.nirIndividu?.[0],
            inseeKey: data?.individu?.[0]?.nirIndividuCle?.[0],
          },
        });
      patients = searchPatients;
      if (patients.length === 0) {
        patients = await this.getHomonymsByLastNameAndFirstName(
          data?.individu?.[0]?.nomUsuel?.[0],
          data?.individu?.[0]?.prenom?.[0],
        );
        homonyms = true;
      }
    } else {
      patients.push(patient);
    }
    return {
      external_reference_id: data?.individu?.[0]?.idPatient?.[0],
      last_name: data?.individu?.[0]?.nomUsuel?.[0],
      first_name: data?.individu?.[0]?.prenom?.[0],
      birth_rank: data?.individu?.[0]?.rangGem?.[0],
      birth_date: data?.individu?.[0]?.dateNaissance?.[0]?.['_']
        ? dayjs(data?.individu?.[0]?.dateNaissance?.[0]?.['_']).format(
            'YYYY-MM-DD',
          )
        : null,
      insee_number: data?.individu?.[0]?.nirIndividu?.[0],
      insee_number_key: data?.individu?.[0]?.nirIndividuCle?.[0],
      homonyms,
      patients,
    };
  }

  async saveCartVital(payload: SaveCardVitalDto, identity: UserIdentity) {
    if (!identity?.org) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    const organization = await this.dataSource
      .getRepository(OrganizationEntity)
      .findOne({ where: { id: identity?.org } });
    if (!organization) {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }

    let patient = new ContactEntity();
    if (!payload?.id) {
      const user = await this.dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: payload?.user_id } });
      patient.organizationId = organization?.id;
      patient.ursId = user?.id;
    } else {
      const resContact = await this.dataSource
        .getRepository(ContactEntity)
        .findOne({
          where: { id: payload?.id },
          relations: {
            medical: { policyHolder: { patient: true }, tariffType: true },
            amos: true,
          },
        });
      if (resContact) {
        patient = resContact;
      }
    }

    patient.externalReferenceId = payload?.external_reference_id;

    const newPatient = await this.updateFromSv(patient, organization);
    return {
      ...newPatient,
      external_reference_id: patient.externalReferenceId,
    };
  }

  async syncFsv(payload: SyncFsvDto) {
    try {
      if (!payload?.patient_id || !payload?.user_id) {
        throw ErrorCode.FORBIDDEN;
      }

      const patient = await this.dataSource
        .getRepository(ContactEntity)
        .findOne({ where: { id: payload?.patient_id } });
      const user = await this.dataSource
        .getRepository(UserEntity)
        .findOne({ where: { id: payload?.user_id } });

      if (!patient || !user) {
        throw ErrorCode.NOT_FOUND_ID;
      }

      await this.sesamvitaleTeletranmistionService.transmettrePatient(
        user,
        patient,
      );
      return patient;
    } catch (error) {
      throw new CBadRequestException(error);
    }
  }

  async updateFrom(payload: UpdateFSVDto, organizationId: number) {
    const patient = await this.dataSource.getRepository(ContactEntity).findOne({
      where: { externalReferenceId: payload?.idPatient },
      relations: {
        medical: { policyHolder: { patient: true }, tariffType: true },
        amos: true,
      },
    });
    const organization = await this.dataSource
      .getRepository(OrganizationEntity)
      .findOne({ where: { id: organizationId } });

    if (patient && organization) {
      await this.updateFromSv(patient, organization);
      return {
        success: true,
      };
    } else {
      throw new CBadRequestException(ErrorCode.NOT_FOUND_PATIENT);
    }
  }
}
