import { Injectable } from '@nestjs/common';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { DataSource } from 'typeorm';
import { ReadCardVitalDto, SaveCardVitalDto } from '../dto/cart-vital.dto';
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
    const queryBuilder = this.dataSource
      .getRepository(ContactEntity)
      .createQueryBuilder('patient');
    queryBuilder.where('patient.lastNamePhonetic = :lastNamePhonetic');
    queryBuilder.andWhere('patient.firstNamePhonetic = :firstNamePhonetic');
    queryBuilder.setParameter(
      'lastNamePhonetic',
      metaphone(lastname).substring(0, 10),
    );
    queryBuilder.setParameter(
      'firstNamePhonetic',
      metaphone(firstname).substring(0, 10),
    );

    return queryBuilder.getRawMany();
  }

  async updateFromSv(patient: ContactEntity) {
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
    const isDateLunaire = respone?.individu?.[0]?.isDateLunaire?.[0];
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
    patient = await this.createOrUpdateAmos(
      patient,
      respone?.individu?.[0]?.couvertureAMO ?? [],
    );
    patient = await this.createOrUpdateAmcs(
      patient,
      respone?.individu?.[0]?.couvertureAMC ?? [],
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

    await this.dataSource.getRepository(ContactEntity).save(patient);
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
        await this.findOneByPatientAndStartDateAndEndDate(
          patient,
          startDate,
          endDate,
          PatientAmoEntity,
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
      }

      patientAmo.amo = amo;
      patientAmo.startDate = startDate;
      patientAmo.endDate = endDate;
      patientAmo.isTp = couvertureAmo?.isTp?.[0];
      patientAmo.isAld = couvertureAmo?.codeAld?.[0];
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
        await this.findOneByPatientAndStartDateAndEndDate(
          patient,
          startDate,
          endDate,
          PatientAmcEntity,
        );

      if (!patientAmc) {
        patientAmc = new PatientAmcEntity();
      }

      const isGu = couvertureAmc?.isGu?.[0];
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
      }

      patientAmc.amc = amc;
      patientAmc.startDate = startDate;
      patientAmc.endDate = endDate;
      patientAmc.isTp = couvertureAmc?.isTp?.[0];
      patientAmc.isCmu = couvertureAmc?.isCmu?.[0];
      patientAmc.isDrePossible = couvertureAmc?.isDrePossible?.[0];
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
      policyHolder.name =
        policyHolderClient?.individu?.[0]?.nomUsuel?.[0] +
        ' ' +
        policyHolderClient?.individu?.[0]?.prenom?.[0];
      policyHolder.inseeNumber =
        policyHolderClient?.individu?.[0]?.nirIndividu?.[0] +
        policyHolderClient?.individu?.[0]?.nirIndividuCle?.[0];
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

  public async findOneByPatientAndStartDateAndEndDate(
    patient: ContactEntity,
    startDate,
    endDate,
    entity,
  ) {
    try {
      const queryBuilder = this.dataSource
        .getRepository(entity)
        .createQueryBuilder('a');
      queryBuilder.where('IDENTITY(a.patient) = :patient');
      if (dayjs(startDate).isValid()) {
        queryBuilder.andWhere('a.startDate = :startDate');
        queryBuilder.setParameter('startDate', startDate);
      } else {
        queryBuilder.andWhere('a.startDate IS NULL');
      }

      if (dayjs(endDate).isValid()) {
        queryBuilder.andWhere('a.endDate = :endDate');
        queryBuilder.setParameter('endDate', endDate);
      } else {
        queryBuilder.andWhere('a.endDate IS NULL');
      }

      queryBuilder.setParameter('patient', patient?.id);
      return await queryBuilder.getRawOne();
    } catch (error) {
      return null;
    }
  }

  async readCartVital(payload: ReadCardVitalDto) {
    let homonyms = false;
    const data = await this.sesamvitaleTeletranmistionService.consulterClient(
      payload.external_reference_id,
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
      const queryBuilder = this.dataSource
        .getRepository(ContactEntity)
        .createQueryBuilder('p');
      queryBuilder.where('p.lastname = :lastname');
      queryBuilder.andWhere('p.firstname = :firstname');
      queryBuilder.andWhere('p.birthOrder = :birthOrder');
      queryBuilder.andWhere('p.birthday = :birthday');
      queryBuilder.andWhere('p.insee = :insee');
      queryBuilder.andWhere('p.inseeKey = :inseeKey');
      queryBuilder.setParameter('lastname', data?.individu?.[0]?.nomUsuel?.[0]);
      queryBuilder.setParameter('firstname', data?.individu?.[0]?.prenom?.[0]);
      queryBuilder.setParameter(
        'birthOrder',
        data?.individu?.[0]?.rangGem?.[0],
      );
      queryBuilder.setParameter(
        'birthday',
        data?.individu?.[0]?.dateNaissance?.[0]?.['_']
          ? dayjs(data?.individu?.[0]?.dateNaissance?.[0]?.['_']).format(
              'YYYY-MM-DD',
            )
          : null,
      );
      queryBuilder.setParameter('insee', data?.individu?.[0]?.nirIndividu?.[0]);
      queryBuilder.setParameter(
        'inseeKey',
        data?.individu?.[0]?.nirIndividuCle?.[0],
      );

      patients = await queryBuilder.getRawMany();
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
            medical: { policyHolder: { patient: true } },
            amos: true,
          },
        });
      if (resContact) {
        patient = resContact;
      }
    }

    patient.externalReferenceId = payload?.external_reference_id;

    await this.updateFromSv(patient);
    return patient;
  }
}
